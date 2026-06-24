import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createDriveFolder,
  createDriveTextFile,
  listDriveCsvInFolder,
  readDriveTextFile,
  updateDriveTextFile,
} from './api.ts';

describe('googleDrive api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads a text file from Drive', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'f1', name: 'codeplug.yaml', mimeType: 'text/yaml' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response('format: test', { status: 200 }));

    const result = await readDriveTextFile('token', 'f1');
    expect(result.ref.name).toBe('codeplug.yaml');
    expect(result.content).toBe('format: test');
  });

  it('lists CSV files in a folder', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          files: [
            { id: '1', name: 'Channels.csv', mimeType: 'text/csv' },
            { id: '2', name: 'notes.txt', mimeType: 'text/plain' },
            { id: '3', name: 'CPS', mimeType: 'application/vnd.google-apps.folder' },
          ],
        }),
        { status: 200 },
      ),
    );

    const files = await listDriveCsvInFolder('token', 'folder-1');
    expect(files.map((f) => f.name)).toEqual(['Channels.csv']);
  });

  it('creates a folder', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'folder-1',
          name: 'opengd77-export-2026-06-24',
          mimeType: 'application/vnd.google-apps.folder',
        }),
        { status: 200 },
      ),
    );

    const ref = await createDriveFolder('token', {
      name: 'opengd77-export-2026-06-24',
      parentFolderId: 'root',
    });
    expect(ref.id).toBe('folder-1');
    expect(ref.name).toBe('opengd77-export-2026-06-24');
  });

  it('creates a text file via multipart upload', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'new', name: 'out.yaml', mimeType: 'application/yaml' }), {
        status: 200,
      }),
    );

    const ref = await createDriveTextFile('token', {
      name: 'out.yaml',
      content: 'hello',
      mimeType: 'application/yaml',
    });
    expect(ref.id).toBe('new');
    expect(ref.name).toBe('out.yaml');
  });

  it('updates file media content', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }));
    await expect(
      updateDriveTextFile('token', 'file-1', 'updated', 'application/yaml'),
    ).resolves.toBeUndefined();
  });
});
