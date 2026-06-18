import type { Channel, Zone } from './csv.ts';
import type { LatLon } from './geo.ts';
import { uniqueLatLon } from './geo.ts';

export const CHANNEL_COLORS = {
  analogue: '#f0c419',
  digital: '#e03131',
  other: '#9c36b5',
} as const;

export interface FilterOptions {
  requireUseLocation: boolean;
  skipZero: boolean;
}

export interface SkippedChannel {
  name: string;
  reason: string;
}

export interface ZoneMemberMissing {
  name: string;
  reason: string;
}

export function markerColor(type: string): string {
  const t = (type || '').toLowerCase();
  if (t === 'analogue' || t === 'analog') return CHANNEL_COLORS.analogue;
  if (t === 'digital') return CHANNEL_COLORS.digital;
  return CHANNEL_COLORS.other;
}

export function markerLabel(group: Channel[], useFull: boolean): string {
  const ch = group[0];
  if (group.length > 1) {
    const base = useFull ? ch.name : ch.callsign;
    return `${base} +${group.length - 1}`;
  }
  return useFull ? ch.name : ch.callsign;
}

export function dominantType(group: Channel[]): string {
  const digital = group.filter((c) => c.type === 'Digital').length;
  return digital >= group.length / 2 ? 'Digital' : 'Analogue';
}

export function applyFilters(
  channels: Channel[],
  { requireUseLocation, skipZero }: FilterOptions,
): { plotted: Channel[]; skipped: SkippedChannel[] } {
  const plotted: Channel[] = [];
  const skipped: SkippedChannel[] = [];

  for (const ch of channels) {
    let reason: string | null = null;
    if (ch.lat == null || ch.lon == null) reason = 'missing coordinates';
    else if (skipZero && ch.lat === 0 && ch.lon === 0) reason = '0,0 coordinates';
    else if (requireUseLocation && !ch.useLocation) reason = 'Use Location = No';
    if (reason) {
      skipped.push({ name: ch.name, reason });
      continue;
    }
    plotted.push(ch);
  }
  return { plotted, skipped };
}

export function groupByCoords(list: Channel[], merge: boolean): Channel[][] {
  if (!merge) return list.map((ch) => [ch]);
  const map = new Map<string, Channel[]>();
  for (const ch of list) {
    const key = `${ch.lat!.toFixed(5)},${ch.lon!.toFixed(5)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ch);
  }
  return [...map.values()];
}

export function buildChannelIndex(plotted: Channel[]): Map<string, Channel> {
  const index = new Map<string, Channel>();
  for (const ch of plotted) {
    if (!index.has(ch.name)) index.set(ch.name, ch);
  }
  return index;
}

export function zoneGeolocatedPoints(
  zone: Zone,
  channelIndex: Map<string, Channel>,
  { skipZero, requireUseLocation }: FilterOptions,
): { points: LatLon[]; missing: ZoneMemberMissing[] } {
  const points: LatLon[] = [];
  const missing: ZoneMemberMissing[] = [];
  const seenNames = new Set<string>();

  for (const memberName of zone.members) {
    if (seenNames.has(memberName)) continue;
    seenNames.add(memberName);

    const ch = channelIndex.get(memberName);
    if (!ch) {
      missing.push({ name: memberName, reason: 'not in Channels.csv' });
      continue;
    }
    if (ch.lat == null || ch.lon == null) {
      missing.push({ name: memberName, reason: 'no coordinates' });
      continue;
    }
    if (skipZero && ch.lat === 0 && ch.lon === 0) {
      missing.push({ name: memberName, reason: '0,0 coordinates' });
      continue;
    }
    if (requireUseLocation && !ch.useLocation) {
      missing.push({ name: memberName, reason: 'Use Location = No' });
      continue;
    }
    points.push([ch.lat, ch.lon]);
  }
  return { points: uniqueLatLon(points), missing };
}
