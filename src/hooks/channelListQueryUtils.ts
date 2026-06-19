import { DISTANCE_FILTER_MARKS_KM } from '../lib/channels.ts';

export const CHANNEL_LIST_COLUMN_STORAGE_KEY = 'channels-list-columns';

export type ChannelSortMode = 'name' | 'distance';

export const CHANNEL_OPTIONAL_COLUMNS = [
  { key: 'contact', header: 'Contact' },
  { key: 'rgl', header: 'RX group list' },
  { key: 'loc', header: 'Locator' },
  { key: 'distance', header: 'Distance from me' },
] as const;

export function defaultChannelVisibleColumns(): string[] {
  return CHANNEL_OPTIONAL_COLUMNS.map((c) => c.key);
}

export function loadChannelVisibleColumns(): string[] {
  try {
    const raw = localStorage.getItem(CHANNEL_LIST_COLUMN_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as string[];
      if (!stored.includes('distance')) {
        return [...stored, 'distance'];
      }
      return stored;
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
