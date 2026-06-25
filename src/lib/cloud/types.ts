export type CloudProviderId = 'google-drive';

export interface CloudAuthState {
  provider: CloudProviderId;
  connected: boolean;
}

export interface RemoteFileRef {
  provider: CloudProviderId;
  id: string;
  name: string;
  mimeType?: string;
}

export interface RemoteFolderRef {
  provider: CloudProviderId;
  id: string;
  name: string;
}

export interface RemoteDriveEntry {
  ref: RemoteFileRef | RemoteFolderRef;
  isFolder: boolean;
}
