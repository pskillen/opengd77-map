import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY_TOKEN } from '../mapTiles.ts';
import { CODEPLUG_STORAGE_KEY, serializeProjects } from '../../state/codeplugStorage.ts';
import { newProject } from '../../models/codeplugProject.ts';
import {
  decodeStorageKeyParam,
  formatByteSize,
  listStorageKeys,
  readStorageEntry,
  storageKeyViewerPath,
} from './storageKeyRegistry.ts';

describe('storageKeyRegistry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('formatByteSize renders human-readable sizes', () => {
    expect(formatByteSize(0)).toBe('0 B');
    expect(formatByteSize(512)).toBe('512 B');
    expect(formatByteSize(2048)).toBe('2.0 KB');
  });

  it('storageKeyViewerPath encodes keys for routes', () => {
    expect(storageKeyViewerPath(CODEPLUG_STORAGE_KEY)).toBe(
      `/debug/local-storage/${encodeURIComponent(CODEPLUG_STORAGE_KEY)}`,
    );
    expect(decodeStorageKeyParam(encodeURIComponent(CODEPLUG_STORAGE_KEY))).toBe(
      CODEPLUG_STORAGE_KEY,
    );
  });

  it('listStorageKeys labels list prefs keys by entity', () => {
    localStorage.setItem('mm9pdy-codeplug-tool.list.channels.proj-1', '{}');
    localStorage.setItem('mm9pdy-codeplug-tool.list.zones.proj-1', '{}');
    localStorage.setItem('mm9pdy-codeplug-tool.extra', '1');
    const rows = listStorageKeys();
    expect(rows.find((row) => row.key === 'mm9pdy-codeplug-tool.list.channels.proj-1')?.label).toBe(
      'List prefs (channels)',
    );
    expect(rows.find((row) => row.key === 'mm9pdy-codeplug-tool.list.zones.proj-1')?.label).toBe(
      'List prefs (zones)',
    );
    expect(rows.find((row) => row.key === 'mm9pdy-codeplug-tool.extra')?.label).toBe('Unknown key');
  });

  it('listStorageKeys includes known keys and app-prefix extras', () => {
    localStorage.setItem('mm9pdy-codeplug-tool.extra', '1');
    const rows = listStorageKeys();
    expect(rows.some((row) => row.key === CODEPLUG_STORAGE_KEY)).toBe(true);
    expect(rows.some((row) => row.key === 'mm9pdy-codeplug-tool.extra')).toBe(true);
    expect(rows.find((row) => row.key === 'mm9pdy-codeplug-tool.extra')?.label).toBe('Unknown key');
  });

  it('readStorageEntry redacts mapbox token values', () => {
    localStorage.setItem(STORAGE_KEY_TOKEN, 'pk.super-secret-token');
    const entry = readStorageEntry({
      key: STORAGE_KEY_TOKEN,
      label: 'Mapbox token',
      redact: true,
    });
    expect(entry.present).toBe(true);
    expect(entry.parsed).toEqual({ value: '••••oken' });
  });

  it('readStorageEntry parses codeplug projects JSON', () => {
    const project = newProject('Alpha');
    localStorage.setItem(
      CODEPLUG_STORAGE_KEY,
      serializeProjects({ activeProjectId: project.id, projects: [project] }),
    );
    const entry = readStorageEntry({
      key: CODEPLUG_STORAGE_KEY,
      label: 'Codeplug projects',
      redact: false,
    });
    expect(entry.parseError).toBeNull();
    expect(entry.parsed).toMatchObject({
      activeProjectId: project.id,
      projects: [{ name: 'Alpha' }],
    });
  });
});
