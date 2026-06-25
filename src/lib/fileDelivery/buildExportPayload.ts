import type { Codeplug } from '../../models/codeplug.ts';
import { serialiseChirpCsv } from '../export/chirp/serialise.ts';
import { serialiseDm32Files } from '../export/dm32/serialise.ts';
import { serialiseNativeYamlExport } from '../export/native-yaml/serialise.ts';
import { serialiseOpenGd77Files } from '../export/opengd77/serialise.ts';
import { collectOpenGd77ExportWarnings } from '../export/opengd77/warnings.ts';
import {
  isMultiFileExportAdapter,
  isSingleFileExportAdapter,
  type ExportAdapter,
} from '../import-export/exportAdapter.ts';
import type { ExportDownloadContext } from '../import-export/types.ts';
import { DEFAULT_CHIRP_PROFILE_ID, getChirpProfile } from '../chirp/profiles.ts';
import { NATIVE_YAML_DEFAULT_FILE_NAME } from '../nativeYaml/serde.ts';
import type { ExportPayload, ExportPayloadResult } from './types.ts';

const CSV_MIME = 'text/csv;charset=utf-8';
const YAML_MIME = 'application/yaml;charset=utf-8';

function csvPayload(fileName: string, content: string): ExportPayload {
  return { fileName, content, mimeType: CSV_MIME, relativePath: fileName };
}

export function buildExportPayload(
  adapter: ExportAdapter,
  ctx: ExportDownloadContext,
): ExportPayloadResult {
  if (isSingleFileExportAdapter(adapter)) {
    if (adapter.id === 'native-yaml') {
      const content = serialiseNativeYamlExport(ctx.codeplug, {
        ...ctx.options,
        project: ctx.project,
      });
      const fileName = ctx.options?.fileName ?? NATIVE_YAML_DEFAULT_FILE_NAME;
      return {
        payloads: [{ fileName, content, mimeType: YAML_MIME }],
        warnings: [],
      };
    }

    const profileId = ctx.options?.profileId ?? DEFAULT_CHIRP_PROFILE_ID;
    const profile = getChirpProfile(profileId);
    const { csv, warnings } = serialiseChirpCsv(ctx.codeplug, ctx.options);
    const fileName = ctx.options?.fileName ?? profile.defaultFileName;
    return {
      payloads: [csvPayload(fileName, csv)],
      warnings,
    };
  }

  if (isMultiFileExportAdapter(adapter)) {
    const files =
      adapter.id === 'dm32'
        ? serialiseDm32Files(ctx.codeplug, ctx.options)
        : serialiseOpenGd77Files(ctx.codeplug, ctx.options);

    const warnings =
      adapter.id === 'opengd77'
        ? collectOpenGd77ExportWarnings(ctx.codeplug, ctx.options)
        : (adapter.collectWarnings?.(ctx.codeplug, ctx.options) ?? []);

    return {
      payloads: Object.entries(files).map(([fileName, content]) => csvPayload(fileName, content)),
      warnings,
    };
  }

  return { payloads: [], warnings: ['No export delivery mode registered'] };
}

export function hasExportableChannels(codeplug: Codeplug): boolean {
  return codeplug.channels.length > 0;
}
