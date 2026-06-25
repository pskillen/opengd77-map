export interface ExportPayload {
  fileName: string;
  content: string;
  mimeType: string;
  /** Path within a multi-file CPS folder (defaults to fileName). */
  relativePath?: string;
}

export interface ImportSource {
  name: string;
  text: string;
}

export interface ExportPayloadResult {
  payloads: ExportPayload[];
  warnings: string[];
}

export type RemoteFileUploader = (payload: ExportPayload) => Promise<void>;

export interface RemoteExportTarget {
  kind: 'remote';
  upload: RemoteFileUploader;
}

export type ExportDeliveryTarget = 'download' | RemoteExportTarget;
