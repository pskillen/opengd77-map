import type { ExportDownloadContext, ExportResult } from '../../import-export/types.ts';
import { downloadNativeYaml } from './download.ts';

export const nativeYamlExportAdapter = {
  id: 'native-yaml' as const,
  label: 'Native YAML',
  delivery: 'single-file' as const,
  defaultFileName: 'codeplug.yaml',
  download(ctx: ExportDownloadContext): ExportResult {
    return downloadNativeYaml(ctx);
  },
} satisfies import('../../import-export/exportAdapter.ts').SingleFileExportAdapter;
