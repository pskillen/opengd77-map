import type { Channel, Contact, RxGroupList, TalkGroup, Zone } from '../models/codeplug.ts';
import type { ChannelTimeslot } from './channelFields/index.ts';
import { buildNameToChannelId } from './codeplug.ts';
import { getMemberWireNames } from './entityProvenance.ts';
import {
  entityRefDisplayName,
  entityRefsEqual,
  resolveContactRefByWireName,
} from './entityRefs.ts';
import type { EntityRef } from './entityRefs.ts';

export function findEntityById<T extends { id: string }>(entities: T[], id: string): T | null {
  return entities.find((e) => e.id === id) ?? null;
}

export function zonesContainingChannel(channelId: string, zones: Zone[]): Zone[] {
  return zones.filter((z) => z.memberChannelIds.includes(channelId));
}

export function channelsReferencingContactId(contactId: string, channels: Channel[]): Channel[] {
  if (!contactId) return [];
  return channels.filter(
    (ch) => ch.contactRef?.kind === 'contact' && ch.contactRef.id === contactId,
  );
}

export function channelsReferencingTalkGroupId(
  talkGroupId: string,
  channels: Channel[],
): Channel[] {
  if (!talkGroupId) return [];
  return channels.filter(
    (ch) => ch.contactRef?.kind === 'talkGroup' && ch.contactRef.id === talkGroupId,
  );
}

export function channelsWithContactRef(ref: EntityRef | null, channels: Channel[]): Channel[] {
  if (!ref) return [];
  return channels.filter((ch) => entityRefsEqual(ch.contactRef, ref));
}

/** @deprecated use channelsWithContactRef or channelsReferencing*Id */
export function channelsWithContactName(
  name: string,
  channels: Channel[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
): Channel[] {
  if (!name || name === 'None') return [];
  const ref = resolveContactRefByWireName(name, talkGroups, contacts);
  if (!ref) return [];
  return channels.filter((ch) => entityRefsEqual(ch.contactRef, ref));
}

export function channelsReferencingRxGroupListId(
  rxGroupListId: string,
  channels: Channel[],
): Channel[] {
  if (!rxGroupListId) return [];
  return channels.filter((ch) => ch.rxGroupListId === rxGroupListId);
}

export function channelsWithRxGroupListId(rxGroupListId: string, channels: Channel[]): Channel[] {
  return channelsReferencingRxGroupListId(rxGroupListId, channels);
}

export function channelsWithTalkGroupName(
  name: string,
  channels: Channel[],
  talkGroups: TalkGroup[],
): Channel[] {
  const tg = talkGroups.find((t) => t.name === name);
  if (!tg) return [];
  return channelsReferencingTalkGroupId(tg.id, channels);
}

export function channelsForZone(zone: Zone, channels: Channel[]): Channel[] {
  const byId = new Map(channels.map((ch) => [ch.id, ch]));
  return zone.memberChannelIds.map((id) => byId.get(id)).filter((ch): ch is Channel => ch != null);
}

export interface ResolvedRxMember {
  name: string;
  kind: 'talkGroup' | 'contact' | 'unresolved';
  entity: TalkGroup | Contact | null;
  /** Per-member RGL timeslot for talk groups; null when unset or not applicable. */
  timeslot: ChannelTimeslot | null;
}

/** Display label for an RGL member timeslot. */
export function formatRglMemberTimeslot(timeslot: ChannelTimeslot | null | undefined): string {
  if (timeslot === 1) return '1';
  if (timeslot === 2) return '2';
  return '—';
}

/** Distinct timeslots a talk group uses within one RX group list. */
export function talkGroupMemberTimeslotsInList(
  rgl: RxGroupList,
  talkGroupId: string,
): ChannelTimeslot[] {
  const slots = new Set<ChannelTimeslot>();
  for (const member of rgl.memberRefs) {
    if (member.ref.kind !== 'talkGroup' || member.ref.id !== talkGroupId) continue;
    if (member.timeslot === 1 || member.timeslot === 2) slots.add(member.timeslot);
  }
  return [...slots].sort();
}

/** Compact timeslot summary for talk-group detail tables (e.g. `1`, `2`, `1 & 2`). */
export function formatTalkGroupTimeslotsInList(slots: ChannelTimeslot[]): string {
  if (slots.length === 0) return '—';
  return slots.map((slot) => String(slot)).join(' & ');
}

/** Member count from model `memberRefs` (not provenance wire names). */
export function rxGroupListMemberCount(rgl: RxGroupList): number {
  return rgl.memberRefs.length;
}

export function resolveRxGroupListMembers(
  rgl: RxGroupList,
  talkGroups: TalkGroup[],
  contacts: Contact[],
): ResolvedRxMember[] {
  if (rgl.memberRefs.length > 0) {
    return rgl.memberRefs.map((member) => {
      const ref = member.ref;
      const name = entityRefDisplayName(ref, talkGroups, contacts);
      const timeslot =
        ref.kind === 'talkGroup' && (member.timeslot === 1 || member.timeslot === 2)
          ? member.timeslot
          : null;
      if (!name) {
        return { name: '', kind: 'unresolved' as const, entity: null, timeslot };
      }
      if (ref.kind === 'talkGroup') {
        const tg = talkGroups.find((t) => t.id === ref.id) ?? null;
        return { name, kind: 'talkGroup' as const, entity: tg, timeslot };
      }
      const contact = contacts.find((c) => c.id === ref.id) ?? null;
      return { name, kind: 'contact' as const, entity: contact, timeslot: null };
    });
  }

  const tgByName = new Map(talkGroups.map((tg) => [tg.name, tg]));
  const contactByName = new Map(contacts.map((c) => [c.name, c]));

  // Legacy v6 display only — memberRefs empty until one-time uplift; see provenance-boundary docs.
  return getMemberWireNames(rgl).map((name) => {
    const tg = tgByName.get(name);
    if (tg) return { name, kind: 'talkGroup' as const, entity: tg, timeslot: null };
    const contact = contactByName.get(name);
    if (contact) return { name, kind: 'contact' as const, entity: contact, timeslot: null };
    return { name, kind: 'unresolved' as const, entity: null, timeslot: null };
  });
}

export function unresolvedZoneMemberCount(zone: Zone, channels: Channel[]): number {
  const nameToId = buildNameToChannelId(channels);
  const resolved = new Set(zone.memberChannelIds);
  let count = 0;
  for (const name of getMemberWireNames(zone)) {
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

export function rxGroupListsContainingMemberRef(
  ref: EntityRef,
  lists: RxGroupList[],
): RxGroupList[] {
  return lists.filter((rgl) => rgl.memberRefs.some((member) => entityRefsEqual(member.ref, ref)));
}

/** @deprecated use rxGroupListsContainingMemberRef */
export function rxGroupListsContainingMember(name: string, lists: RxGroupList[]): RxGroupList[] {
  if (!name) return [];
  return lists.filter((rgl) => getMemberWireNames(rgl).includes(name));
}

/** Reference counts in list tables — zero renders as empty. */
export function formatReferenceCount(count: number): string {
  return count === 0 ? '' : String(count);
}

export function externalChannelLinks(callsign: string): { label: string; url: string }[] {
  const q = encodeURIComponent(callsign);
  return [
    {
      label: 'ukrepeater.net',
      url: `https://ukrepeater.net/repeaterlist.html?filter=${q}`,
    },
    {
      label: 'RepeaterBook',
      url: `https://www.repeaterbook.com/repeaters/display.php?state=&call=${q}`,
    },
    { label: 'RadioReference', url: `https://www.radioreference.com/db/search/?q=${q}` },
    { label: 'QRZ', url: `https://www.qrz.com/db/${q}` },
  ];
}
