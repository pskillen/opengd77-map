import type { ExportDownloadContext, ExportResult } from '../../import-export/types.ts';
import { NATIVE_YAML_DEFAULT_FILE_NAME } from '../../nativeYaml/serde.ts';
import { downloadBlob } from '../opengd77/download.ts';
import { serialiseNativeYamlExport } from './serialise.ts';

export function downloadNativeYaml(ctx: ExportDownloadContext): ExportResult {
  const yaml = serialiseNativeYamlExport(ctx.codeplug, {
    ...ctx.options,
    project: ctx.project,
  });
  const fileName = ctx.options?.fileName ?? NATIVE_YAML_DEFAULT_FILE_NAME;
  const blob = new Blob([yaml], { type: 'application/yaml;charset=utf-8' });
  downloadBlob(blob, fileName);
  return { warnings: [] };
}
