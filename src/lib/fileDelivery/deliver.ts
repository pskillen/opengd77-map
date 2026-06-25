import { downloadBlob } from '../export/opengd77/download.ts';
import type { ExportDeliveryTarget, ExportPayload } from './types.ts';

export function deliverExportPayloads(
  payloads: ExportPayload[],
  target: ExportDeliveryTarget,
): Promise<void> {
  if (target === 'download') {
    for (const payload of payloads) {
      const blob = new Blob([payload.content], { type: payload.mimeType });
      downloadBlob(blob, payload.fileName);
    }
    return Promise.resolve();
  }

  return payloads.reduce(
    (chain, payload) => chain.then(() => target.upload(payload)),
    Promise.resolve(),
  );
}
