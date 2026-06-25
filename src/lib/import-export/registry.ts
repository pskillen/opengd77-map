import { parseCsv } from '../csv.ts';
import { chirpProfileSelectData, DEFAULT_CHIRP_PROFILE_ID } from '../chirp/profiles.ts';
import { DEFAULT_DM32_PROFILE_ID, dm32ProfileSelectData } from '../dm32/profiles.ts';
import { DEFAULT_OPENGD77_PROFILE_ID, opengd77ProfileSelectData } from '../opengd77/profiles.ts';
import { opengd77Adapter } from '../import/opengd77/adapter.ts';
import { chirpAdapter } from '../import/chirp/adapter.ts';
import { dm32Adapter } from '../import/dm32/adapter.ts';
import { detectNativeDocument, nativeYamlAdapter } from '../import/native-yaml/adapter.ts';
import { opengd77ExportAdapter } from '../export/opengd77/adapter.ts';
import { chirpExportAdapter } from '../export/chirp/adapter.ts';
import { dm32ExportAdapter } from '../export/dm32/adapter.ts';
import { nativeYamlExportAdapter } from '../export/native-yaml/adapter.ts';
import type { ImportAdapter } from './importAdapter.ts';
import type { ExportAdapter } from './exportAdapter.ts';
import type { VendorFormatId } from './types.ts';

export interface FormatProfilesInfo {
  options: { value: string; label: string }[];
  defaultId: string;
  required: boolean;
}

export const importAdapters: readonly ImportAdapter[] = [
  opengd77Adapter,
  chirpAdapter,
  dm32Adapter,
  nativeYamlAdapter,
];

export const exportAdapters: readonly ExportAdapter[] = [
  opengd77ExportAdapter,
  chirpExportAdapter,
  dm32ExportAdapter,
  nativeYamlExportAdapter,
];

export function getImportAdapter(id: VendorFormatId): ImportAdapter {
  const adapter = importAdapters.find((a) => a.id === id);
  if (!adapter) throw new Error(`No import adapter registered for format: ${id}`);
  return adapter;
}

export function getExportAdapter(id: VendorFormatId): ExportAdapter {
  const adapter = exportAdapters.find((a) => a.id === id);
  if (!adapter) throw new Error(`No export adapter registered for format: ${id}`);
  return adapter;
}

/** Profile picker metadata for import/export UI — null when format has no profiles. */
export function getFormatProfiles(formatId: VendorFormatId): FormatProfilesInfo | null {
  if (formatId === 'chirp') {
    return {
      options: chirpProfileSelectData(),
      defaultId: DEFAULT_CHIRP_PROFILE_ID,
      required: true,
    };
  }
  if (formatId === 'opengd77') {
    return {
      options: opengd77ProfileSelectData(),
      defaultId: DEFAULT_OPENGD77_PROFILE_ID,
      required: true,
    };
  }
  if (formatId === 'dm32') {
    return {
      options: dm32ProfileSelectData(),
      defaultId: DEFAULT_DM32_PROFILE_ID,
      required: true,
    };
  }
  return null;
}

function headerRow(text: string): string[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  return rows[0]?.map((h) => h.trim()) ?? [];
}

/** Classify a batch of files — used for home import auto-detect. */
export async function detectImportAdapter(
  files: File[],
): Promise<VendorFormatId | 'ambiguous' | 'unknown'> {
  if (!files.length) return 'unknown';

  const matchedFormats = new Set<VendorFormatId>();

  for (const file of files) {
    const text = await file.text();
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) {
      if (detectNativeDocument(text, file.name)) {
        matchedFormats.add('native-yaml');
      }
      continue;
    }
    const headers = headerRow(text);
    for (const adapter of importAdapters) {
      if (adapter.detectKind(file.name, headers) !== 'unknown') {
        matchedFormats.add(adapter.id);
      }
    }
  }

  if (matchedFormats.size === 0) return 'unknown';
  if (matchedFormats.size > 1) return 'ambiguous';
  return [...matchedFormats][0]!;
}
