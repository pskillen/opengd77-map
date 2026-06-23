import { DISTANCE_FILTER_MARKS_KM } from '../lib/channels.ts';

export const CHANNEL_LIST_COLUMN_STORAGE_KEY = 'channels-list-columns';
export const CHANNEL_LIST_COLUMNS_SCHEMA_KEY = 'channels-list-columns-schema';
/** Bump when adding optional columns that should be merged into existing saved prefs once. */
export const CHANNEL_LIST_COLUMNS_SCHEMA_VERSION = 4;

export type ChannelSortMode = 'name' | 'distance';

export const CHANNEL_OPTIONAL_COLUMNS = [
  { key: 'rxTx', header: 'RX/TX', defaultVisible: true },
  { key: 'contact', header: 'Contact', defaultVisible: true },
  { key: 'rgl', header: 'RX group list', defaultVisible: true },
  { key: 'loc', header: 'Locator', defaultVisible: true },
  { key: 'distance', header: 'Distance from me', defaultVisible: true },
  { key: 'power', header: 'Power', defaultVisible: true },
  { key: 'squelch', header: 'Squelch', defaultVisible: false },
  { key: 'comment', header: 'Comment', defaultVisible: false },
] as const;

export function defaultChannelVisibleColumns(): string[] {
  return CHANNEL_OPTIONAL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
}

export function loadChannelVisibleColumns(): string[] {
  const validKeys = new Set(CHANNEL_OPTIONAL_COLUMNS.map((c) => c.key));

  try {
    const raw = localStorage.getItem(CHANNEL_LIST_COLUMN_STORAGE_KEY);
    if (raw) {
      let cols = (JSON.parse(raw) as string[]).filter((k) =>
        validKeys.has(k as (typeof CHANNEL_OPTIONAL_COLUMNS)[number]['key']),
      );

      const schema = Number.parseInt(
        localStorage.getItem(CHANNEL_LIST_COLUMNS_SCHEMA_KEY) ?? '0',
        10,
      );
      if (schema < CHANNEL_LIST_COLUMNS_SCHEMA_VERSION) {
        if (!cols.includes('distance')) cols = [...cols, 'distance'];
        if (!cols.includes('power')) cols = [...cols, 'power'];
        if (schema < 4) {
          cols = cols.filter((k) => k !== 'callsign');
          if (!cols.includes('rxTx')) cols = ['rxTx', ...cols];
        }
        localStorage.setItem(CHANNEL_LIST_COLUMN_STORAGE_KEY, JSON.stringify(cols));
        localStorage.setItem(
          CHANNEL_LIST_COLUMNS_SCHEMA_KEY,
          String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION),
        );
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
