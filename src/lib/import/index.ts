import { parseCsv } from '../csv.ts';
import { deriveProjectNameFromImportFiles } from '../../models/codeplugProject.ts';
import { importAdapters } from './registry.ts';
import type { ImportResult } from './types.ts';

function headerRow(text: string): string[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  return rows[0]?.map((h) => h.trim()) ?? [];
}

export async function importFiles(
  files: File[],
  options?: { directoryName?: string },
): Promise<ImportResult> {
  const result: ImportResult = {
    recognised: [],
    skipped: [],
    errors: [],
  };

  const adapter = importAdapters[0];

  for (const file of files) {
    const fileName = file.name;
    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      result.errors.push({
        fileName,
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    const headers = headerRow(text);
    const kind = adapter.detectKind(fileName, headers);

    if (kind === 'unknown') {
      result.skipped.push({ fileName, message: 'Unrecognised CSV format' });
      continue;
    }

    try {
      switch (kind) {
        case 'channels':
          result.channels = adapter.parseChannels(text);
          break;
        case 'zones':
          result.zones = adapter.parseZones(text);
          break;
        case 'contacts': {
          const parsed = adapter.parseContacts(text);
          result.contacts = parsed.contacts;
          result.talkGroups = parsed.talkGroups;
          break;
        }
        case 'rxGroupLists':
          result.rxGroupLists = adapter.parseRxGroupLists(text);
          break;
      }
      result.recognised.push(fileName);
    } catch (err) {
      result.errors.push({
        fileName,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  result.suggestedProjectName = deriveProjectNameFromImportFiles(files, {
    directoryName: options?.directoryName,
    formatLabel: adapter.projectNameLabel,
  });

  return result;
}

interface DroppedEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file: (success: (file: File) => void) => void;
  createReader?: () => DroppedDirectoryReader;
}

interface DroppedDirectoryReader {
  readEntries: (success: (entries: DroppedEntry[]) => void) => void;
}

async function readEntryFiles(entry: DroppedEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => resolve([file]));
    });
  }

  if (!entry.isDirectory || !entry.createReader) return [];

  const reader = entry.createReader();
  const entries = await new Promise<DroppedEntry[]>((resolve) => {
    reader.readEntries(resolve);
  });

  const nested = await Promise.all(entries.map(readEntryFiles));
  return nested.flat();
}

export interface CollectedImportFiles {
  files: File[];
  /** Leaf folder name when the user dropped a single directory. */
  directoryName?: string;
}

export async function collectFilesFromDataTransfer(
  dt: DataTransfer,
): Promise<CollectedImportFiles> {
  const items = [...dt.items];
  if (items.length && typeof items[0].webkitGetAsEntry === 'function') {
    const entries = items
      .map((item) => item.webkitGetAsEntry?.() as DroppedEntry | null)
      .filter((entry): entry is DroppedEntry => entry != null);

    const directoryName =
      entries.length === 1 && entries[0].isDirectory ? entries[0].name : undefined;

    const files = (await Promise.all(entries.map(readEntryFiles))).flat();
    const csvFiles = files.filter((f) => f.name.toLowerCase().endsWith('.csv'));
    if (csvFiles.length) return { files: csvFiles, directoryName };
  }

  return {
    files: [...dt.files].filter((f) => f.name.toLowerCase().endsWith('.csv')),
  };
}
