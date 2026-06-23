import { zipSync, strToU8 } from 'fflate';
import type { Codeplug } from '../../../models/codeplug.ts';
import type { ExportOptions, ExportResult } from '../../import-export/types.ts';
import { serialiseOpenGd77Files, type OpenGd77ExportFiles } from './serialise.ts';
import { collectOpenGd77ExportWarnings } from './warnings.ts';

export type OpenGd77ExportFileName = keyof OpenGd77ExportFiles;

export function buildOpenGd77Zip(codeplug: Codeplug, options?: ExportOptions): Uint8Array {
  const files = serialiseOpenGd77Files(codeplug, options);
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

export function downloadOpenGd77File(
  codeplug: Codeplug,
  fileName: OpenGd77ExportFileName,
  options?: ExportOptions,
): ExportResult {
  const files = serialiseOpenGd77Files(codeplug, options);
  const blob = new Blob([files[fileName]], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, fileName);
  return { warnings: collectOpenGd77ExportWarnings(codeplug, options) };
}

export function downloadOpenGd77Zip(codeplug: Codeplug, options?: ExportOptions): ExportResult {
  const zipName = options?.fileName ?? 'opengd77-export.zip';
  const zip = buildOpenGd77Zip(codeplug, options);
  const blob = new Blob([new Uint8Array(zip)], { type: 'application/zip' });
  downloadBlob(blob, zipName);
  return { warnings: collectOpenGd77ExportWarnings(codeplug, options) };
}
