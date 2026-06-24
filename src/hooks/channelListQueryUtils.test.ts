import { describe, expect, it } from 'vitest';
import {
  CHANNEL_LIST_COLUMNS_SCHEMA_VERSION,
  CHANNEL_OPTIONAL_COLUMNS,
  defaultChannelVisibleColumns,
  loadChannelVisibleColumns,
  migrateLegacyChannelColumns,
} from './channelListQueryUtils.ts';
import {
  LEGACY_CHANNEL_LIST_COLUMNS_SCHEMA_KEY,
  LEGACY_CHANNEL_LIST_COLUMN_STORAGE_KEY,
  channelListColumnsKey,
  channelListColumnsSchemaKey,
} from '../lib/listPrefs/keys.ts';

describe('defaultChannelVisibleColumns', () => {
  it('includes band, mode, power by default and omits squelch', () => {
    const cols = defaultChannelVisibleColumns();
    expect(cols).toContain('band');
    expect(cols).toContain('mode');
    expect(cols).toContain('power');
    expect(cols).not.toContain('squelch');
    expect(cols).toEqual(
      CHANNEL_OPTIONAL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
    );
  });
});

describe('loadChannelVisibleColumns', () => {
  const projectId = 'proj-load-test';

  it('migrates stored prefs to include power and rxTx but not squelch', () => {
    const key = channelListColumnsKey(projectId);
    const schemaKey = channelListColumnsSchemaKey(projectId);
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify(['contact', 'rgl', 'loc', 'distance']));
    localStorage.removeItem(schemaKey);

    try {
      const cols = loadChannelVisibleColumns(projectId);
      expect(cols).toContain('power');
      expect(cols).toContain('rxTx');
      expect(cols).not.toContain('callsign');
      expect(cols).not.toContain('squelch');
      expect(localStorage.getItem(schemaKey)).toBe(String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));
    } finally {
      if (previous == null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      if (previousSchema == null) localStorage.removeItem(schemaKey);
      else localStorage.setItem(schemaKey, previousSchema);
    }
  });

  it('respects user choice to hide power and distance after migration', () => {
    const key = channelListColumnsKey(projectId);
    const schemaKey = channelListColumnsSchemaKey(projectId);
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify(['contact', 'rgl', 'loc']));
    localStorage.setItem(schemaKey, String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));

    try {
      const cols = loadChannelVisibleColumns(projectId);
      expect(cols).not.toContain('power');
      expect(cols).not.toContain('distance');
    } finally {
      if (previous == null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      if (previousSchema == null) localStorage.removeItem(schemaKey);
      else localStorage.setItem(schemaKey, previousSchema);
    }
  });

  it('persists an explicitly empty column selection', () => {
    const key = channelListColumnsKey(projectId);
    const schemaKey = channelListColumnsSchemaKey(projectId);
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify([]));
    localStorage.setItem(schemaKey, String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));

    try {
      expect(loadChannelVisibleColumns(projectId)).toEqual([]);
    } finally {
      if (previous == null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      if (previousSchema == null) localStorage.removeItem(schemaKey);
      else localStorage.setItem(schemaKey, previousSchema);
    }
  });

  it('copies legacy global column prefs to per-project key once', () => {
    const key = channelListColumnsKey(projectId);
    const legacyKey = LEGACY_CHANNEL_LIST_COLUMN_STORAGE_KEY;
    const legacySchemaKey = LEGACY_CHANNEL_LIST_COLUMNS_SCHEMA_KEY;
    const previousKey = localStorage.getItem(key);
    const previousLegacy = localStorage.getItem(legacyKey);
    const previousLegacySchema = localStorage.getItem(legacySchemaKey);

    localStorage.removeItem(key);
    localStorage.setItem(legacyKey, JSON.stringify(['contact', 'rgl']));
    localStorage.setItem(legacySchemaKey, String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));

    try {
      migrateLegacyChannelColumns(projectId);
      expect(localStorage.getItem(key)).toBe(JSON.stringify(['contact', 'rgl']));
      expect(loadChannelVisibleColumns(projectId)).toContain('contact');
    } finally {
      if (previousKey == null) localStorage.removeItem(key);
      else localStorage.setItem(key, previousKey);
      if (previousLegacy == null) localStorage.removeItem(legacyKey);
      else localStorage.setItem(legacyKey, previousLegacy);
      if (previousLegacySchema == null) localStorage.removeItem(legacySchemaKey);
      else localStorage.setItem(legacySchemaKey, previousLegacySchema);
    }
  });
});
