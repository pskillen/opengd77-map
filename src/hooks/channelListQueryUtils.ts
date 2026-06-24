import { DISTANCE_FILTER_MARKS_KM } from '../lib/channels.ts';
import {
  LEGACY_CHANNEL_LIST_COLUMNS_SCHEMA_KEY,
  LEGACY_CHANNEL_LIST_COLUMN_STORAGE_KEY,
  channelListColumnsKey,
  channelListColumnsSchemaKey,
} from '../lib/listPrefs/keys.ts';

/** @deprecated Use channelListColumnsKey(projectId) — kept for legacy registry entry. */
export const CHANNEL_LIST_COLUMN_STORAGE_KEY = LEGACY_CHANNEL_LIST_COLUMN_STORAGE_KEY;
/** @deprecated Use channelListColumnsSchemaKey(projectId). */
export const CHANNEL_LIST_COLUMNS_SCHEMA_KEY = LEGACY_CHANNEL_LIST_COLUMNS_SCHEMA_KEY;

export { channelListColumnsKey, channelListColumnsSchemaKey } from '../lib/listPrefs/keys.ts';

/** Bump when adding optional columns that should be merged into existing saved prefs once. */
export const CHANNEL_LIST_COLUMNS_SCHEMA_VERSION = 6;

export type ChannelSortMode = 'name' | 'distance';

export const CHANNEL_OPTIONAL_COLUMNS = [
  { key: 'band', header: 'Band', defaultVisible: true },
  { key: 'mode', header: 'Mode', defaultVisible: true },
  { key: 'rxTx', header: 'RX/TX', defaultVisible: true },
  { key: 'contact', header: 'Contact', defaultVisible: true },
  { key: 'rgl', header: 'RX group list', defaultVisible: true },
  { key: 'loc', header: 'Locator', defaultVisible: true },
  { key: 'distance', header: 'Distance from me', defaultVisible: true },
  { key: 'power', header: 'Power', defaultVisible: true },
  { key: 'squelch', header: 'Squelch', defaultVisible: false },
  { key: 'comment', header: 'Comment', defaultVisible: false },
  { key: 'abbreviation', header: 'Abbreviation', defaultVisible: false },
] as const;

export function defaultChannelVisibleColumns(): string[] {
  return CHANNEL_OPTIONAL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
}

export function migrateLegacyChannelColumns(projectId: string): void {
  const storageKey = channelListColumnsKey(projectId);
  if (localStorage.getItem(storageKey) !== null) return;

  const legacyRaw = localStorage.getItem(LEGACY_CHANNEL_LIST_COLUMN_STORAGE_KEY);
  if (legacyRaw === null) return;

  localStorage.setItem(storageKey, legacyRaw);
  const legacySchema = localStorage.getItem(LEGACY_CHANNEL_LIST_COLUMNS_SCHEMA_KEY);
  if (legacySchema !== null) {
    localStorage.setItem(channelListColumnsSchemaKey(projectId), legacySchema);
  }
}

export function loadChannelVisibleColumns(projectId: string): string[] {
  migrateLegacyChannelColumns(projectId);

  const storageKey = channelListColumnsKey(projectId);
  const schemaKey = channelListColumnsSchemaKey(projectId);
  const validKeys = new Set(CHANNEL_OPTIONAL_COLUMNS.map((c) => c.key));

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      let cols = (JSON.parse(raw) as string[]).filter((k) =>
        validKeys.has(k as (typeof CHANNEL_OPTIONAL_COLUMNS)[number]['key']),
      );

      const schema = Number.parseInt(localStorage.getItem(schemaKey) ?? '0', 10);
      if (schema < CHANNEL_LIST_COLUMNS_SCHEMA_VERSION) {
        if (!cols.includes('distance')) cols = [...cols, 'distance'];
        if (!cols.includes('power')) cols = [...cols, 'power'];
        if (schema < 4) {
          cols = cols.filter((k) => k !== 'callsign');
          if (!cols.includes('rxTx')) cols = ['rxTx', ...cols];
        }
        if (schema < 5 && cols.length > 0) {
          if (!cols.includes('band')) cols = ['band', ...cols];
          if (!cols.includes('mode')) {
            const bandIdx = cols.indexOf('band');
            cols =
              bandIdx >= 0
                ? [
                    ...cols.slice(0, bandIdx + 1),
                    'mode',
                    ...cols.slice(bandIdx + 1).filter((k) => k !== 'mode'),
                  ]
                : ['mode', ...cols.filter((k) => k !== 'mode')];
          }
        }
        localStorage.setItem(storageKey, JSON.stringify(cols));
        localStorage.setItem(schemaKey, String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));
      }

      return cols;
    }
  } catch {
    /* ignore */
  }
  return defaultChannelVisibleColumns();
}

export function defaultMaxDistanceKm(): number {
  return DISTANCE_FILTER_MARKS_KM[2];
}

export function parseMaxDistanceKm(raw: string | null): number {
  if (!raw) return defaultMaxDistanceKm();
  const n = Number.parseInt(raw, 10);
  return (DISTANCE_FILTER_MARKS_KM as readonly number[]).includes(n) ? n : defaultMaxDistanceKm();
}

export function parseCsvParam(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').filter(Boolean);
}

export function serializeCsvParam(values: string[]): string | null {
  return values.length > 0 ? values.join(',') : null;
}
