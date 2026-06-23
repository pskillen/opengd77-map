import { zipSync, strToU8 } from 'fflate';
import type { Codeplug } from '../../../models/codeplug.ts';
import type { ExportOptions } from '../../import-export/types.ts';
import { serialiseDm32Files, type Dm32ExportFiles } from './serialise.ts';
import type { Dm32ExportFileName } from '../../import/dm32/columns.ts';

export function buildDm32Zip(codeplug: Codeplug, options?: ExportOptions): Uint8Array {
  const files = serialiseDm32Files(codeplug, options);
  const zipEntries: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    zipEntries[name] = strToU8(content);
  }
  return zipSync(zipEntries);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadDm32File(
  codeplug: Codeplug,
  fileName: Dm32ExportFileName,
  options?: ExportOptions,
): void {
  const files = serialiseDm32Files(codeplug, options);
  const blob = new Blob([files[fileName]], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, fileName);
}

export function downloadDm32Zip(codeplug: Codeplug, options?: ExportOptions): void {
  const zipName = options?.fileName ?? 'dm32-export.zip';
  const zip = buildDm32Zip(codeplug, options);
  const blob = new Blob([new Uint8Array(zip)], { type: 'application/zip' });
  downloadBlob(blob, zipName);
}

export type { Dm32ExportFiles };
