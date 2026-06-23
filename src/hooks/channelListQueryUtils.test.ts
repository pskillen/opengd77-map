import { describe, expect, it } from 'vitest';
import {
  CHANNEL_LIST_COLUMN_STORAGE_KEY,
  CHANNEL_LIST_COLUMNS_SCHEMA_KEY,
  CHANNEL_LIST_COLUMNS_SCHEMA_VERSION,
  CHANNEL_OPTIONAL_COLUMNS,
  defaultChannelVisibleColumns,
  loadChannelVisibleColumns,
} from './channelListQueryUtils.ts';

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
  it('migrates stored prefs to include power and rxTx but not squelch', () => {
    const key = CHANNEL_LIST_COLUMN_STORAGE_KEY;
    const schemaKey = CHANNEL_LIST_COLUMNS_SCHEMA_KEY;
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify(['contact', 'rgl', 'loc', 'distance']));
    localStorage.removeItem(schemaKey);

    try {
      const cols = loadChannelVisibleColumns();
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
    const key = CHANNEL_LIST_COLUMN_STORAGE_KEY;
    const schemaKey = CHANNEL_LIST_COLUMNS_SCHEMA_KEY;
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify(['contact', 'rgl', 'loc']));
    localStorage.setItem(schemaKey, String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));

    try {
      const cols = loadChannelVisibleColumns();
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
    const key = CHANNEL_LIST_COLUMN_STORAGE_KEY;
    const schemaKey = CHANNEL_LIST_COLUMNS_SCHEMA_KEY;
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify([]));
    localStorage.setItem(schemaKey, String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));

    try {
      expect(loadChannelVisibleColumns()).toEqual([]);
    } finally {
      if (previous == null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      if (previousSchema == null) localStorage.removeItem(schemaKey);
      else localStorage.setItem(schemaKey, previousSchema);
    }
  });
});
