import type { RemoteDriveEntry, RemoteFileRef, RemoteFolderRef } from '../types.ts';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

interface DriveFileListResponse {
  files?: Array<{
    id: string;
    name: string;
    mimeType?: string;
  }>;
}

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType?: string;
}

async function driveJson<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${text}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function toFileRef(file: DriveFileMetadata): RemoteFileRef {
  return {
    provider: 'google-drive',
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
  };
}

export async function listDriveFolder(
  accessToken: string,
  folderId: string,
): Promise<RemoteDriveEntry[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id,name,mimeType)');
  const url = `${DRIVE_API_BASE}/files?q=${q}&fields=${fields}&pageSize=200`;
  const data = await driveJson<DriveFileListResponse>(url, accessToken);
  return (data.files ?? []).map((file) => {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
    const ref: RemoteFileRef | RemoteFolderRef = isFolder
      ? { provider: 'google-drive', id: file.id, name: file.name }
      : toFileRef(file);
    return { ref, isFolder };
  });
}

export async function readDriveTextFile(
  accessToken: string,
  fileId: string,
): Promise<{ ref: RemoteFileRef; content: string }> {
  const meta = await driveJson<DriveFileMetadata>(
    `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType`,
    accessToken,
  );
  const contentResponse = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!contentResponse.ok) {
    throw new Error(`Google Drive download failed (${contentResponse.status})`);
  }
  const content = await contentResponse.text();
  return { ref: toFileRef(meta), content };
}

export async function createDriveFolder(
  accessToken: string,
  input: { name: string; parentFolderId?: string },
): Promise<RemoteFolderRef> {
  const metadata: Record<string, unknown> = {
    name: input.name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (input.parentFolderId) metadata.parents = [input.parentFolderId];

  const file = await driveJson<DriveFileMetadata>(
    `${DRIVE_API_BASE}/files?fields=id,name,mimeType`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    },
  );

  return { provider: 'google-drive', id: file.id, name: file.name };
}

export async function createDriveTextFile(
  accessToken: string,
  input: { name: string; content: string; mimeType: string; parentFolderId?: string },
): Promise<RemoteFileRef> {
  const metadata: Record<string, unknown> = { name: input.name };
  if (input.parentFolderId) metadata.parents = [input.parentFolderId];

  const boundary = 'codeplug_tool_boundary';
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${input.mimeType}\r\n\r\n` +
    `${input.content}\r\n` +
    `--${boundary}--`;

  const response = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Drive upload failed (${response.status}): ${text}`);
  }

  const file = (await response.json()) as DriveFileMetadata;
  return toFileRef(file);
}

export async function updateDriveTextFile(
  accessToken: string,
  fileId: string,
  content: string,
  mimeType: string,
): Promise<void> {
  const response = await fetch(`${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
    },
    body: content,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Drive update failed (${response.status}): ${text}`);
  }
}

export async function listDriveCsvInFolder(
  accessToken: string,
  folderId: string,
): Promise<RemoteFileRef[]> {
  const entries = await listDriveFolder(accessToken, folderId);
  return entries
    .filter((entry) => !entry.isFolder && entry.ref.name.toLowerCase().endsWith('.csv'))
    .map((entry) => entry.ref as RemoteFileRef);
}

export async function listDriveYamlFiles(
  accessToken: string,
  folderId = 'root',
): Promise<RemoteFileRef[]> {
  const entries = await listDriveFolder(accessToken, folderId);
  return entries
    .filter(
      (entry) =>
        !entry.isFolder &&
        (entry.ref.name.toLowerCase().endsWith('.yaml') ||
          entry.ref.name.toLowerCase().endsWith('.yml')),
    )
    .map((entry) => entry.ref as RemoteFileRef);
}
