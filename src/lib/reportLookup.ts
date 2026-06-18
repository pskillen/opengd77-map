import type { Channel, Contact, RxGroupList, TalkGroup, Zone } from '../models/codeplug.ts';
import { buildNameToChannelId } from './codeplug.ts';

export function findEntityById<T extends { id: string }>(entities: T[], id: string): T | null {
  return entities.find((e) => e.id === id) ?? null;
}

export function zonesContainingChannel(channelId: string, zones: Zone[]): Zone[] {
  return zones.filter((z) => z.memberChannelIds.includes(channelId));
}

export function channelsWithContactName(name: string, channels: Channel[]): Channel[] {
  if (!name || name === 'None') return [];
  return channels.filter((ch) => ch.contactName === name);
}

export function channelsWithRxGroupList(name: string, channels: Channel[]): Channel[] {
  if (!name || name === 'None') return [];
  return channels.filter((ch) => ch.rxGroupListName === name);
}

export function channelsWithTalkGroupName(name: string, channels: Channel[]): Channel[] {
  return channelsWithContactName(name, channels);
}

export function channelsForZone(zone: Zone, channels: Channel[]): Channel[] {
  const byId = new Map(channels.map((ch) => [ch.id, ch]));
  return zone.memberChannelIds
    .map((id) => byId.get(id))
    .filter((ch): ch is Channel => ch != null);
}

export interface ResolvedRxMember {
  name: string;
  kind: 'talkGroup' | 'contact' | 'unresolved';
  entity: TalkGroup | Contact | null;
}

export function resolveRxGroupListMembers(
  rgl: RxGroupList,
  talkGroups: TalkGroup[],
  contacts: Contact[],
): ResolvedRxMember[] {
  const tgByName = new Map(talkGroups.map((tg) => [tg.name, tg]));
  const contactByName = new Map(contacts.map((c) => [c.name, c]));

  return rgl.sourceMemberNames.map((name) => {
    const tg = tgByName.get(name);
    if (tg) return { name, kind: 'talkGroup' as const, entity: tg };
    const contact = contactByName.get(name);
    if (contact) return { name, kind: 'contact' as const, entity: contact };
    return { name, kind: 'unresolved' as const, entity: null };
  });
}

export function unresolvedZoneMemberCount(zone: Zone, channels: Channel[]): number {
  const nameToId = buildNameToChannelId(channels);
  const resolved = new Set(zone.memberChannelIds);
  let count = 0;
  for (const name of zone.sourceMemberNames) {
    const id = nameToId.get(name);
    if (!id || !resolved.has(id)) count++;
  }
  return count;
}

export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

export function findTalkGroupByName(name: string, talkGroups: TalkGroup[]): TalkGroup | null {
  return talkGroups.find((tg) => tg.name === name) ?? null;
}

export function findContactByName(name: string, contacts: Contact[]): Contact | null {
  return contacts.find((c) => c.name === name) ?? null;
}

export function findRxGroupListByName(name: string, lists: RxGroupList[]): RxGroupList | null {
  return lists.find((r) => r.name === name) ?? null;
}

export function externalChannelLinks(callsign: string): { label: string; url: string }[] {
  const q = encodeURIComponent(callsign);
  return [
    { label: 'RepeaterBook', url: `https://www.repeaterbook.com/repeaters/display.php?state=&call=${q}` },
    { label: 'RadioReference', url: `https://www.radioreference.com/db/search/?q=${q}` },
    { label: 'QRZ', url: `https://www.qrz.com/db/${q}` },
  ];
}
