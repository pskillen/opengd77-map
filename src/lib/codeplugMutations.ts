import { extractCallsign } from './csv.ts';
import {
  channelFieldDefaults,
  newId,
  type Channel,
  type Codeplug,
  type Contact,
  type RxGroupList,
  type TalkGroup,
  type Zone,
} from '../models/codeplug.ts';

export const OPENGD77_MAX_ZONE_MEMBERS = 80;

export type ChannelInput = Omit<Channel, 'id' | 'callsign'> & { name: string };

export type ZoneInput = Pick<Zone, 'name'> & { memberChannelIds?: string[] };

export type TalkGroupInput = Omit<TalkGroup, 'id'>;

export type ContactInput = Omit<Contact, 'id'>;

export type RxGroupListInput = Pick<RxGroupList, 'name'> & { sourceMemberNames?: string[] };

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

function dedupeMemberNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function propagateContactWireRename(
  codeplug: Codeplug,
  oldName: string,
  newName: string,
): Codeplug {
  const channels = codeplug.channels.map((ch) =>
    ch.contactName === oldName ? { ...ch, contactName: newName } : ch,
  );
  const rxGroupLists = codeplug.rxGroupLists.map((rgl) => ({
    ...rgl,
    sourceMemberNames: rgl.sourceMemberNames.map((n) => (n === oldName ? newName : n)),
  }));
  return { ...codeplug, channels, rxGroupLists };
}

function clearContactWireReferences(codeplug: Codeplug, name: string): Codeplug {
  const channels = codeplug.channels.map((ch) =>
    ch.contactName === name ? { ...ch, contactName: '' } : ch,
  );
  const rxGroupLists = codeplug.rxGroupLists.map((rgl) => ({
    ...rgl,
    sourceMemberNames: rgl.sourceMemberNames.filter((n) => n !== name),
  }));
  return { ...codeplug, channels, rxGroupLists };
}

function propagateRxGroupListWireRename(
  codeplug: Codeplug,
  oldName: string,
  newName: string,
): Codeplug {
  const channels = codeplug.channels.map((ch) =>
    ch.rxGroupListName === oldName ? { ...ch, rxGroupListName: newName } : ch,
  );
  return { ...codeplug, channels };
}

function clearRxGroupListWireReferences(codeplug: Codeplug, name: string): Codeplug {
  const channels = codeplug.channels.map((ch) =>
    ch.rxGroupListName === name ? { ...ch, rxGroupListName: '' } : ch,
  );
  return { ...codeplug, channels };
}

export function addTalkGroup(codeplug: Codeplug, input: TalkGroupInput): Codeplug {
  const talkGroup: TalkGroup = {
    ...input,
    id: newId(),
    name: input.name.trim(),
  };
  return { ...codeplug, talkGroups: [...codeplug.talkGroups, talkGroup] };
}

export function updateTalkGroup(
  codeplug: Codeplug,
  talkGroupId: string,
  patch: Partial<TalkGroupInput>,
): Codeplug {
  const index = codeplug.talkGroups.findIndex((tg) => tg.id === talkGroupId);
  if (index < 0) return codeplug;

  const existing = codeplug.talkGroups[index];
  const name = patch.name !== undefined ? patch.name.trim() : existing.name;
  const updated: TalkGroup = { ...existing, ...patch, id: talkGroupId, name };

  const talkGroups = [...codeplug.talkGroups];
  talkGroups[index] = updated;

  let next: Codeplug = { ...codeplug, talkGroups };
  if (name !== existing.name) {
    next = propagateContactWireRename(next, existing.name, name);
  }
  return next;
}

export function deleteTalkGroup(codeplug: Codeplug, talkGroupId: string): Codeplug {
  const talkGroup = codeplug.talkGroups.find((tg) => tg.id === talkGroupId);
  if (!talkGroup) return codeplug;

  const next: Codeplug = {
    ...codeplug,
    talkGroups: codeplug.talkGroups.filter((tg) => tg.id !== talkGroupId),
  };
  return clearContactWireReferences(next, talkGroup.name);
}

export function addContact(codeplug: Codeplug, input: ContactInput): Codeplug {
  const contact: Contact = {
    ...input,
    id: newId(),
    name: input.name.trim(),
  };
  return { ...codeplug, contacts: [...codeplug.contacts, contact] };
}

export function updateContact(
  codeplug: Codeplug,
  contactId: string,
  patch: Partial<ContactInput>,
): Codeplug {
  const index = codeplug.contacts.findIndex((c) => c.id === contactId);
  if (index < 0) return codeplug;

  const existing = codeplug.contacts[index];
  const name = patch.name !== undefined ? patch.name.trim() : existing.name;
  const updated: Contact = { ...existing, ...patch, id: contactId, name };

  const contacts = [...codeplug.contacts];
  contacts[index] = updated;

  let next: Codeplug = { ...codeplug, contacts };
  if (name !== existing.name) {
    next = propagateContactWireRename(next, existing.name, name);
  }
  return next;
}

export function deleteContact(codeplug: Codeplug, contactId: string): Codeplug {
  const contact = codeplug.contacts.find((c) => c.id === contactId);
  if (!contact) return codeplug;

  const next: Codeplug = {
    ...codeplug,
    contacts: codeplug.contacts.filter((c) => c.id !== contactId),
  };
  return clearContactWireReferences(next, contact.name);
}

export function addRxGroupList(codeplug: Codeplug, input: RxGroupListInput): Codeplug {
  const rgl: RxGroupList = {
    id: newId(),
    name: input.name.trim(),
    sourceMemberNames: dedupeMemberNames(input.sourceMemberNames ?? []),
  };
  return { ...codeplug, rxGroupLists: [...codeplug.rxGroupLists, rgl] };
}

export function updateRxGroupList(
  codeplug: Codeplug,
  rglId: string,
  patch: Partial<RxGroupListInput>,
): Codeplug {
  const index = codeplug.rxGroupLists.findIndex((r) => r.id === rglId);
  if (index < 0) return codeplug;

  const existing = codeplug.rxGroupLists[index];
  const name = patch.name !== undefined ? patch.name.trim() : existing.name;
  const sourceMemberNames =
    patch.sourceMemberNames !== undefined
      ? dedupeMemberNames(patch.sourceMemberNames)
      : existing.sourceMemberNames;
  const updated: RxGroupList = { ...existing, name, sourceMemberNames };

  const rxGroupLists = [...codeplug.rxGroupLists];
  rxGroupLists[index] = updated;

  let next: Codeplug = { ...codeplug, rxGroupLists };
  if (name !== existing.name) {
    next = propagateRxGroupListWireRename(next, existing.name, name);
  }
  return next;
}

export function deleteRxGroupList(codeplug: Codeplug, rglId: string): Codeplug {
  const rgl = codeplug.rxGroupLists.find((r) => r.id === rglId);
  if (!rgl) return codeplug;

  const next: Codeplug = {
    ...codeplug,
    rxGroupLists: codeplug.rxGroupLists.filter((r) => r.id !== rglId),
  };
  return clearRxGroupListWireReferences(next, rgl.name);
}

export function setRxGroupListMembers(
  codeplug: Codeplug,
  rglId: string,
  sourceMemberNames: string[],
): Codeplug {
  const rxGroupLists = codeplug.rxGroupLists.map((rgl) => {
    if (rgl.id !== rglId) return rgl;
    return { ...rgl, sourceMemberNames: dedupeMemberNames(sourceMemberNames) };
  });
  return { ...codeplug, rxGroupLists };
}
