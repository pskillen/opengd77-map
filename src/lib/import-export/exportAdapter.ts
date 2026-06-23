import type { Codeplug } from '../../models/codeplug.ts';
import type {
  ExportDownloadContext,
  ExportOptions,
  ExportResult,
  VendorFormatId,
} from './types.ts';

export interface BaseExportAdapter {
  readonly id: VendorFormatId;
  readonly label: string;
}

export interface MultiFileExportAdapter extends BaseExportAdapter {
  readonly delivery: 'multi-file';
  readonly fileNames: readonly string[];
  downloadFile(codeplug: Codeplug, fileName: string, options?: ExportOptions): ExportResult;
  downloadZip(codeplug: Codeplug, options?: ExportOptions): ExportResult;
  /** Optional export-time warnings (e.g. profile cardinality limits). */
  collectWarnings?(codeplug: Codeplug, options?: ExportOptions): string[];
}

export interface SingleFileExportAdapter extends BaseExportAdapter {
  readonly delivery: 'single-file';
  readonly defaultFileName: string;
  download(ctx: ExportDownloadContext): ExportResult;
}

export type ExportAdapter = MultiFileExportAdapter | SingleFileExportAdapter;

export function isMultiFileExportAdapter(
  adapter: ExportAdapter,
): adapter is MultiFileExportAdapter {
  return adapter.delivery === 'multi-file';
}

export function isSingleFileExportAdapter(
  adapter: ExportAdapter,
): adapter is SingleFileExportAdapter {
  return adapter.delivery === 'single-file';
}
