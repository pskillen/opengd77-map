import { parseCsv } from '../csv.ts';
import { opengd77Adapter } from '../import/opengd77/adapter.ts';
import { opengd77ExportAdapter } from '../export/opengd77/adapter.ts';
import type { ImportAdapter } from './importAdapter.ts';
import type { ExportAdapter } from './exportAdapter.ts';
import type { VendorFormatId } from './types.ts';

export const importAdapters: readonly ImportAdapter[] = [opengd77Adapter];

export const exportAdapters: readonly ExportAdapter[] = [opengd77ExportAdapter];

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
