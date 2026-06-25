import type { VendorFormatId } from '../import-export/types.ts';
import { NATIVE_YAML_DEFAULT_FILE_NAME } from '../nativeYaml/serde.ts';

/** ISO calendar date for export filenames (YYYY-MM-DD). */
export function exportDateStamp(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/** Replace characters unsafe in Drive / OS file names. */
export function sanitizeExportBaseName(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : 'codeplug';
}

/** Insert `-YYYY-MM-DD` before the file extension. */
export function stampExportFileName(
  fileName: string,
  dateStamp: string = exportDateStamp(),
): string {
  const match = /^(.+?)(\.[^.]+)?$/.exec(fileName);
  if (!match) return `${fileName}-${dateStamp}`;
  const base = match[1] ?? fileName;
  const ext = match[2] ?? '';
  return `${base}-${dateStamp}${ext}`;
}

export function defaultNativeYamlDriveFileName(
  projectName?: string | null,
  at: Date = new Date(),
): string {
  const stamp = exportDateStamp(at);
  const base = sanitizeExportBaseName(projectName?.trim() || 'codeplug');
  return `${base}-${stamp}.yaml`;
}

export function defaultSingleFileDriveFileName(
  defaultFileName: string,
  at: Date = new Date(),
): string {
  return stampExportFileName(defaultFileName, exportDateStamp(at));
}

export function defaultMultiFileCpsFolderName(
  formatId: VendorFormatId,
  projectName?: string | null,
  at: Date = new Date(),
): string {
  const stamp = exportDateStamp(at);
  if (projectName?.trim()) {
    return `${sanitizeExportBaseName(projectName)}-${stamp}`;
  }
  const label =
    formatId === 'opengd77'
      ? 'opengd77-export'
      : formatId === 'dm32'
        ? 'dm32-export'
        : 'cps-export';
  return `${label}-${stamp}`;
}

export function defaultDriveExportFileName(
  formatId: VendorFormatId,
  options?: { projectName?: string | null; defaultFileName?: string },
  at: Date = new Date(),
): string {
  if (formatId === 'native-yaml') {
    return defaultNativeYamlDriveFileName(options?.projectName, at);
  }
  if (options?.defaultFileName) {
    return defaultSingleFileDriveFileName(options.defaultFileName, at);
  }
  return stampExportFileName(NATIVE_YAML_DEFAULT_FILE_NAME, exportDateStamp(at));
}
