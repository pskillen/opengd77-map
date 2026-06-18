import { extractCallsign } from './csv.ts';
import {
  channelFieldDefaults,
  newId,
  type Channel,
  type Codeplug,
  type Zone,
} from '../models/codeplug.ts';

export const OPENGD77_MAX_ZONE_MEMBERS = 80;

export type ChannelInput = Omit<Channel, 'id' | 'callsign'> & { name: string };

export type ZoneInput = Pick<Zone, 'name'> & { memberChannelIds?: string[] };

function channelById(channels: Channel[], id: string): Channel | undefined {
  return channels.find((ch) => ch.id === id);
}

/** Map ordered channel ids to export wire names (skips missing ids). */
export function channelNamesForIds(channels: Channel[], ids: string[]): string[] {
  const names: string[] = [];
  for (const id of ids) {
    const ch = channelById(channels, id);
    if (ch) names.push(ch.name);
  }
  return names;
}

export function zoneWithMemberIds(
  zone: Zone,
  memberChannelIds: string[],
  channels: Channel[],
): Zone {
  return {
    ...zone,
    memberChannelIds,
    sourceMemberNames: channelNamesForIds(channels, memberChannelIds),
  };
}

/** Refresh export wire names for all zones from current channel ids. */
export function refreshAllZoneSourceNames(codeplug: Codeplug): Zone[] {
  return codeplug.zones.map((zone) =>
    zoneWithMemberIds(zone, zone.memberChannelIds, codeplug.channels),
  );
}

export function deriveCallsignFromName(name: string): string {
  return extractCallsign(name);
}

export function addChannel(codeplug: Codeplug, input: ChannelInput): Codeplug {
  const channel: Channel = {
    ...channelFieldDefaults(),
    ...input,
    id: newId(),
    callsign: deriveCallsignFromName(input.name),
  };
  return {
    ...codeplug,
    channels: [...codeplug.channels, channel],
  };
}

export function updateChannel(
  codeplug: Codeplug,
  channelId: string,
  patch: Partial<ChannelInput>,
): Codeplug {
  const index = codeplug.channels.findIndex((ch) => ch.id === channelId);
  if (index < 0) return codeplug;

  const existing = codeplug.channels[index];
  const name = patch.name ?? existing.name;
  const updated: Channel = {
    ...existing,
    ...patch,
    id: channelId,
    name,
    callsign: deriveCallsignFromName(name),
  };

  const channels = [...codeplug.channels];
  channels[index] = updated;

  const withChannels = { ...codeplug, channels };
  return {
    ...withChannels,
    zones: refreshAllZoneSourceNames(withChannels),
  };
}

export function deleteChannel(codeplug: Codeplug, channelId: string): Codeplug {
  const channels = codeplug.channels.filter((ch) => ch.id !== channelId);
  const zones = codeplug.zones.map((zone) => {
    const memberChannelIds = zone.memberChannelIds.filter((id) => id !== channelId);
    return zoneWithMemberIds({ ...zone, memberChannelIds }, memberChannelIds, channels);
  });
  return { ...codeplug, channels, zones };
}

export function addZone(codeplug: Codeplug, input: ZoneInput): Codeplug {
  const memberChannelIds = input.memberChannelIds ?? [];
  if (memberChannelIds.length > OPENGD77_MAX_ZONE_MEMBERS) {
    throw new Error(`Zone cannot have more than ${OPENGD77_MAX_ZONE_MEMBERS} members`);
  }
  const channelIds = new Set(codeplug.channels.map((ch) => ch.id));
  for (const id of memberChannelIds) {
    if (!channelIds.has(id)) {
      throw new Error(`Unknown channel id: ${id}`);
    }
  }

  const zone: Zone = {
    id: newId(),
    name: input.name,
    memberChannelIds,
    sourceMemberNames: channelNamesForIds(codeplug.channels, memberChannelIds),
  };
  return { ...codeplug, zones: [...codeplug.zones, zone] };
}

export function updateZone(
  codeplug: Codeplug,
  zoneId: string,
  patch: Partial<ZoneInput>,
): Codeplug {
  const zones = codeplug.zones.map((zone) => (zone.id === zoneId ? { ...zone, ...patch } : zone));
  return { ...codeplug, zones };
}

export function deleteZone(codeplug: Codeplug, zoneId: string): Codeplug {
  return {
    ...codeplug,
    zones: codeplug.zones.filter((z) => z.id !== zoneId),
  };
}

export function setZoneMembers(
  codeplug: Codeplug,
  zoneId: string,
  memberChannelIds: string[],
): Codeplug {
  if (memberChannelIds.length > OPENGD77_MAX_ZONE_MEMBERS) {
    throw new Error(`Zone cannot have more than ${OPENGD77_MAX_ZONE_MEMBERS} members`);
  }

  const channelIds = new Set(codeplug.channels.map((ch) => ch.id));
  for (const id of memberChannelIds) {
    if (!channelIds.has(id)) {
      throw new Error(`Unknown channel id: ${id}`);
    }
  }

  const zones = codeplug.zones.map((zone) => {
    if (zone.id !== zoneId) return zone;
    return zoneWithMemberIds(zone, memberChannelIds, codeplug.channels);
  });
  return { ...codeplug, zones };
}
