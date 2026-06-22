import type { Channel, Codeplug, Contact, RxGroupList, TalkGroup } from '../models/codeplug.ts';
import type { EntityMeta } from './entityProvenance.ts';

export type EntityRefKind = 'talkGroup' | 'contact';

export interface EntityRef {
  kind: EntityRefKind;
  id: string;
}

/** Normalise absent OpenGD77 wire values to empty string. */
export function normaliseWireName(name: string | undefined | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed || trimmed === 'None') return '';
  return trimmed;
}

export function entityRefKey(ref: EntityRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function parseEntityRefKey(key: string): EntityRef | null {
  const match = /^(talkGroup|contact):(.+)$/.exec(key);
  if (!match) return null;
  return { kind: match[1] as EntityRefKind, id: match[2] };
}

export function entityRefsEqual(a: EntityRef | null, b: EntityRef | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.kind === b.kind && a.id === b.id;
}

export function resolveContactRefByWireName(
  name: string,
  talkGroups: TalkGroup[],
  contacts: Contact[],
): EntityRef | null {
  const wire = normaliseWireName(name);
  if (!wire) return null;

  const tg = talkGroups.find((t) => t.name === wire);
  if (tg) return { kind: 'talkGroup', id: tg.id };

  const contact = contacts.find((c) => c.name === wire);
  if (contact) return { kind: 'contact', id: contact.id };

  return null;
}

export function resolveRxGroupListIdByName(
  name: string,
  rxGroupLists: RxGroupList[],
): string | null {
  const wire = normaliseWireName(name);
  if (!wire) return null;
  const list = rxGroupLists.find((r) => r.name === wire);
  return list?.id ?? null;
}

export function resolveMemberRefsByWireNames(
  names: string[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
): { memberRefs: EntityRef[]; unresolved: string[] } {
  const memberRefs: EntityRef[] = [];
  const unresolved: string[] = [];
  const seen = new Set<string>();

  for (const rawName of names) {
    const wire = normaliseWireName(rawName);
    if (!wire) continue;
    if (seen.has(wire)) continue;
    seen.add(wire);

    const ref = resolveContactRefByWireName(wire, talkGroups, contacts);
    if (ref) {
      const key = entityRefKey(ref);
      if (!memberRefs.some((r) => entityRefKey(r) === key)) {
        memberRefs.push(ref);
      }
    } else {
      unresolved.push(wire);
    }
  }

  return { memberRefs, unresolved };
}

export function findTalkGroupById(id: string, talkGroups: TalkGroup[]): TalkGroup | null {
  return talkGroups.find((tg) => tg.id === id) ?? null;
}

export function findContactById(id: string, contacts: Contact[]): Contact | null {
  return contacts.find((c) => c.id === id) ?? null;
}

export function entityRefDisplayName(
  ref: EntityRef | null,
  talkGroups: TalkGroup[],
  contacts: Contact[],
): string | null {
  if (!ref) return null;
  if (ref.kind === 'talkGroup') {
    return findTalkGroupById(ref.id, talkGroups)?.name ?? null;
  }
  return findContactById(ref.id, contacts)?.name ?? null;
}

export function memberRefsToWireNames(
  memberRefs: EntityRef[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
): string[] {
  const names: string[] = [];
  for (const ref of memberRefs) {
    const name = entityRefDisplayName(ref, talkGroups, contacts);
    if (name) names.push(name);
  }
  return names;
}

export function resolveRxGroupListMemberRefs(
  rxGroupLists: RxGroupList[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
): RxGroupList[] {
  return rxGroupLists.map((rgl) => {
    const wireNames = rgl.meta?.imported?.memberWireNames;
    if (wireNames === undefined) return rgl;
    const { memberRefs } = resolveMemberRefsByWireNames(wireNames, talkGroups, contacts);
    if (
      rgl.memberRefs.length === memberRefs.length &&
      rgl.memberRefs.every((ref, i) => entityRefsEqual(ref, memberRefs[i]))
    ) {
      return rgl;
    }
    return { ...rgl, memberRefs };
  });
}
export function resolveChannelRxGroupListIds(
  channels: Channel[],
  rxGroupLists: RxGroupList[],
): Channel[] {
  return channels.map((ch) => {
    const wireName = ch.meta?.imported?.rxGroupListWireName;
    if (wireName === undefined) return ch;
    const rxGroupListId = resolveRxGroupListIdByName(wireName, rxGroupLists);
    if (ch.rxGroupListId === rxGroupListId) return ch;
    return { ...ch, rxGroupListId };
  });
}

export function resolveChannelContactRefs(
  channels: Channel[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
): Channel[] {
  return channels.map((ch) => {
    const wireName = ch.meta?.imported?.contactWireName;
    if (wireName === undefined) return ch;
    const contactRef = resolveContactRefByWireName(wireName, talkGroups, contacts);
    if (entityRefsEqual(ch.contactRef, contactRef)) return ch;
    return { ...ch, contactRef };
  });
}

export interface ChannelContactExportSource {
  contactRef: EntityRef | null;
  meta?: EntityMeta;
}

export interface ChannelRxListExportSource {
  rxGroupListId: string | null;
  meta?: EntityMeta;
}

export function contactRefWireNameForExport(
  channel: ChannelContactExportSource,
  codeplug: Codeplug,
): string {
  const provenance = channel.meta?.imported?.contactWireName;
  if (provenance !== undefined) return provenance;

  const name = entityRefDisplayName(channel.contactRef, codeplug.talkGroups, codeplug.contacts);
  return name ?? '';
}

export function rxGroupListWireNameForExport(
  channel: ChannelRxListExportSource,
  codeplug: Codeplug,
): string {
  const provenance = channel.meta?.imported?.rxGroupListWireName;
  if (provenance !== undefined) return provenance;

  if (!channel.rxGroupListId) return '';
  const list = codeplug.rxGroupLists.find((r) => r.id === channel.rxGroupListId);
  return list?.name ?? '';
}
