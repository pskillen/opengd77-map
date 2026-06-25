import { parseCsv } from '../csv.ts';
import { deriveProjectNameFromImportFiles } from '../../models/codeplugProject.ts';
import { adapterSupportsKind, isNativeDocumentAdapter } from '../import-export/importAdapter.ts';
import {
  detectImportAdapter,
  getFormatProfiles,
  getImportAdapter,
} from '../import-export/registry.ts';
import type { ImportParseContext } from '../import-export/importAdapter.ts';
import type { VendorFormatId } from '../import-export/types.ts';
import type { ImportEntityKind } from '../import-export/types.ts';
import type { ImportResult } from './types.ts';
import { importResultFromNativeProject } from './native-yaml/importResult.ts';
import { detectNativeDocument } from './native-yaml/adapter.ts';
import { APRS_HEADERS, DTMF_HEADERS } from './opengd77/columns.ts';

function headerRow(text: string): string[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  return rows[0]?.map((h) => h.trim()) ?? [];
}

/** DTMF/APRS CPS files are header-only — not modelled; skip on full-folder import. */
function isOpenGd77HeaderOnlyFile(fileName: string, headers: string[]): boolean {
  const lower = fileName.toLowerCase();
  if (lower === 'dtmf.csv' || lower === 'aprs.csv') return true;
  const headerKey = headers.join(',');
  return headerKey === DTMF_HEADERS.join(',') || headerKey === APRS_HEADERS.join(',');
}

/** DM32 Scan.csv and DMR-ID.csv are deferred — skip on import. */
function isDm32SkippedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower === 'scan.csv' || lower.includes('scanlist') || lower === 'dmr-id.csv';
}

function parseEntity(
  adapter: ReturnType<typeof getImportAdapter>,
  kind: ImportEntityKind,
  text: string,
  ctx?: ImportParseContext,
): Partial<ImportResult> {
  switch (kind) {
    case 'channels':
      return { channels: adapter.parseChannels(text, ctx) };
    case 'zones': {
      if (!adapter.parseZones) {
        throw new Error('Adapter does not support zone import');
      }
      return { zones: adapter.parseZones(text, ctx) };
    }
    case 'contacts': {
      if (!adapter.parseContacts) {
        throw new Error('Adapter does not support contact import');
      }
      const parsed = adapter.parseContacts(text, ctx);
      return { contacts: parsed.contacts, talkGroups: parsed.talkGroups };
    }
    case 'talkGroups': {
      if (!adapter.parseTalkGroups) {
        throw new Error('Adapter does not support talk group import');
      }
      return { talkGroups: adapter.parseTalkGroups(text, ctx) };
    }
    case 'dtmfContacts': {
      if (!adapter.parseDtmfContacts) {
        throw new Error('Adapter does not support DTMF contact import');
      }
      return { contacts: adapter.parseDtmfContacts(text, ctx) };
    }
    case 'rxGroupLists': {
      if (!adapter.parseRxGroupLists) {
        throw new Error('Adapter does not support RX group list import');
      }
      return { rxGroupLists: adapter.parseRxGroupLists(text, ctx) };
    }
  }
}

export interface ImportFilesOptions {
  directoryName?: string;
  vendorFormatId?: VendorFormatId;
  /** Required for profile-aware formats (CHIRP, OpenGD77). */
  profileId?: string;
}

export async function importFiles(
  files: File[],
  options?: ImportFilesOptions,
): Promise<ImportResult> {
  const result: ImportResult = {
    recognised: [],
    skipped: [],
    errors: [],
  };

  if (!files.length) return result;

  const vendorFormatId = options?.vendorFormatId;
  const strictFormat = vendorFormatId != null;
  let adapter;

  if (strictFormat) {
    adapter = getImportAdapter(vendorFormatId);
  } else {
    const detected = await detectImportAdapter(files);
    if (detected === 'unknown') {
      result.errors.push({
        fileName: '(batch)',
        message: 'Unrecognised CSV format',
      });
      return result;
    }
    if (detected === 'ambiguous') {
      result.errors.push({
        fileName: '(batch)',
        message: 'Mixed CPS formats in one drop — import one format at a time',
      });
      return result;
    }
    adapter = getImportAdapter(detected);
  }

  result.formatId = adapter.id;

  const profiles = getFormatProfiles(adapter.id);
  let parseCtx: ImportParseContext | undefined;
  if (profiles?.required) {
    if (!options?.profileId) {
      result.errors.push({
        fileName: '(batch)',
        message: `Radio profile is required for ${adapter.label} import`,
      });
      return result;
    }
    parseCtx = { profileId: options.profileId };
  }

  if (isNativeDocumentAdapter(adapter)) {
    if (files.length !== 1) {
      result.errors.push({
        fileName: '(batch)',
        message: `${adapter.label} import expects a single YAML file`,
      });
      return result;
    }

    const file = files[0]!;
    const fileName = file.name;
    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      result.errors.push({
        fileName,
        message: err instanceof Error ? err.message : String(err),
      });
      return result;
    }

    if (!detectNativeDocument(text, fileName)) {
      result.errors.push({
        fileName,
        message: `File is not a recognised ${adapter.label} document`,
      });
      return result;
    }

    try {
      const project = adapter.parseDocument(text);
      const parsed = importResultFromNativeProject(project, fileName, adapter.id);
      return { ...result, ...parsed };
    } catch (err) {
      result.errors.push({
        fileName,
        message: err instanceof Error ? err.message : String(err),
      });
      return result;
    }
  }

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
      const message = strictFormat
        ? `File is not a recognised ${adapter.label} export`
        : 'Unrecognised CSV format';
      if (
        strictFormat &&
        adapter.id === 'opengd77' &&
        isOpenGd77HeaderOnlyFile(fileName, headers)
      ) {
        result.skipped.push({
          fileName,
          message: 'Header-only CPS file not imported into codeplug',
        });
        continue;
      }
      if (strictFormat && adapter.id === 'dm32' && isDm32SkippedFile(fileName)) {
        result.skipped.push({
          fileName,
          message: 'Deferred CPS file not imported into codeplug',
        });
        continue;
      }
      if (strictFormat) {
        result.errors.push({ fileName, message });
      } else {
        result.skipped.push({ fileName, message });
      }
      continue;
    }

    if (!adapterSupportsKind(adapter, kind)) {
      result.errors.push({
        fileName,
        message: `Adapter does not support ${kind} import`,
      });
      continue;
    }

    try {
      const parsed = parseEntity(adapter, kind, text, parseCtx);
      if (parsed.channels !== undefined) result.channels = parsed.channels;
      if (parsed.zones !== undefined) result.zones = parsed.zones;
      if (parsed.contacts !== undefined) {
        result.contacts = [...(result.contacts ?? []), ...parsed.contacts];
      }
      if (parsed.talkGroups !== undefined) {
        result.talkGroups = [...(result.talkGroups ?? []), ...parsed.talkGroups];
      }
      if (parsed.rxGroupLists !== undefined) result.rxGroupLists = parsed.rxGroupLists;
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
    const yamlFiles = files.filter((f) => /\.ya?ml$/i.test(f.name));
    if (yamlFiles.length) return { files: yamlFiles, directoryName };
    if (csvFiles.length) return { files: csvFiles, directoryName };
  }

  const yamlFromList = [...dt.files].filter((f) => /\.ya?ml$/i.test(f.name));
  if (yamlFromList.length) return { files: yamlFromList };

  return {
    files: [...dt.files].filter((f) => f.name.toLowerCase().endsWith('.csv')),
  };
}

export { detectImportAdapter } from '../import-export/registry.ts';
