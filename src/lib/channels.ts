import type { Channel, ChannelMode, Zone } from '../models/codeplug.ts';
import type { LatLon } from './geo.ts';
import { uniqueLatLon } from './geo.ts';
import { buildNameToChannelId } from './codeplug.ts';
import { channelDisplayLabel } from './channelNaming.ts';
import { getMemberWireNames } from './entityProvenance.ts';
import { resolveChannelModeProfiles } from './channelExpansion/index.ts';
import { modeColor, modeLabel } from './channelModes.ts';
import { haversineDistanceM } from './geoDistance.ts';

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

export function markerColor(mode: ChannelMode): string {
  return modeColor(mode);
}

export function channelModeSummary(channel: Channel): string {
  if (channel.multiMode) {
    return resolveChannelModeProfiles(channel)
      .map((p) => modeLabel(p.mode))
      .join('+');
  }
  return modeLabel(channel.mode);
}

/** All RF modes represented on a channel (profiles when multi-mode, else primary mode). */
export function channelModesForFilter(channel: Channel): ChannelMode[] {
  if (channel.multiMode && channel.modeProfiles.length > 0) {
    return channel.modeProfiles.map((p) => p.mode);
  }
  return [channel.mode];
}

/** True when any represented mode matches one of the selected filter values. */
export function channelMatchesModeFilter(channel: Channel, modeFilter: string[]): boolean {
  if (!modeFilter.length) return true;
  const modes = channelModesForFilter(channel);
  return modeFilter.some((m) => modes.includes(m as ChannelMode));
}

export function markerLabel(group: Channel[], useFull: boolean): string {
  const ch = group[0];
  if (group.length === 1 && ch.multiMode) {
    const base = channelDisplayLabel(ch, useFull);
    return `${base} ${channelModeSummary(ch)}`;
  }
  if (group.length > 1) {
    const base = channelDisplayLabel(ch, useFull);
    return `${base} +${group.length - 1}`;
  }
  return channelDisplayLabel(ch, useFull);
}

export function dominantMode(group: Channel[]): ChannelMode {
  const counts = new Map<ChannelMode, number>();
  for (const ch of group) {
    counts.set(ch.mode, (counts.get(ch.mode) ?? 0) + 1);
  }
  let best = group[0].mode;
  let bestCount = 0;
  for (const [mode, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = mode;
    }
  }
  return best;
}

export function applyFilters(
  channels: Channel[],
  { requireUseLocation, skipZero }: FilterOptions,
): { plotted: Channel[]; skipped: SkippedChannel[] } {
  const plotted: Channel[] = [];
  const skipped: SkippedChannel[] = [];

  for (const ch of channels) {
    let reason: string | null = null;
    if (ch.location == null) reason = 'missing coordinates';
    else if (skipZero && ch.location.lat === 0 && ch.location.lon === 0) reason = '0,0 coordinates';
    else if (requireUseLocation && !ch.useLocation) reason = 'Use Location = No';
    else if (ch.hideFromMap) reason = 'hidden from map';
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
    const key = `${ch.location!.lat.toFixed(5)},${ch.location!.lon.toFixed(5)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ch);
  }
  return [...map.values()];
}

export function buildChannelById(plotted: Channel[]): Map<string, Channel> {
  const index = new Map<string, Channel>();
  for (const ch of plotted) {
    index.set(ch.id, ch);
  }
  return index;
}

export function zoneGeolocatedPoints(
  zone: Zone,
  plottedById: Map<string, Channel>,
  allChannels: Channel[],
  { skipZero, requireUseLocation }: FilterOptions,
): { points: LatLon[]; missing: ZoneMemberMissing[] } {
  const points: LatLon[] = [];
  const missing: ZoneMemberMissing[] = [];
  const seenIds = new Set<string>();

  const nameToId = buildNameToChannelId(allChannels);

  for (const memberName of getMemberWireNames(zone)) {
    if (!nameToId.has(memberName)) {
      missing.push({ name: memberName, reason: 'unresolved member' });
    }
  }

  for (const memberId of zone.memberChannelIds) {
    if (seenIds.has(memberId)) continue;
    seenIds.add(memberId);

    const ch = plottedById.get(memberId);
    if (!ch) {
      const name = allChannels.find((c) => c.id === memberId)?.name ?? memberId;
      missing.push({ name, reason: 'filtered out or missing coordinates' });
      continue;
    }
    if (ch.location == null) {
      missing.push({ name: ch.name, reason: 'no coordinates' });
      continue;
    }
    if (skipZero && ch.location.lat === 0 && ch.location.lon === 0) {
      missing.push({ name: ch.name, reason: '0,0 coordinates' });
      continue;
    }
    if (requireUseLocation && !ch.useLocation) {
      missing.push({ name: ch.name, reason: 'Use Location = No' });
      continue;
    }
    points.push([ch.location.lat, ch.location.lon]);
  }
  return { points: uniqueLatLon(points), missing };
}

export function channelHasGeolocation(channel: Channel): boolean {
  const { location, useLocation } = channel;
  return (
    useLocation &&
    location != null &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lon)
  );
}

/** Kilometre marks for the channel-list distance filter slider. */
export const DISTANCE_FILTER_MARKS_KM = [5, 10, 25, 50, 100, 200] as const;

export function filterChannelsByDistance(
  channels: Channel[],
  options: {
    enabled: boolean;
    operatorPosition: { lat: number; lon: number } | null;
    maxDistanceKm: number;
  },
): Channel[] {
  const { enabled, operatorPosition, maxDistanceKm } = options;
  if (!enabled) return channels;

  return channels.filter((ch) => {
    if (!channelHasGeolocation(ch)) return false;
    if (!operatorPosition) return true;
    const metres = haversineDistanceM(
      operatorPosition.lat,
      operatorPosition.lon,
      ch.location!.lat,
      ch.location!.lon,
    );
    return metres <= maxDistanceKm * 1000;
  });
}
