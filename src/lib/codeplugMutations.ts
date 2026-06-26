import { composeChannelWireName } from './channelNaming.ts';
import { syncChannelFromPrimaryProfile } from './channelExpansion/index.ts';
import {
  channelFieldDefaults,
  newId,
  type Channel,
  type Codeplug,
  type Contact,
  type RxGroupList,
  type RxGroupListMember,
  type TalkGroup,
  type Zone,
} from '../models/codeplug.ts';
import { getMemberWireNames, setMemberWireNames } from './entityProvenance.ts';
import type { EntityRefKind } from './entityRefs.ts';
import {
  entityRefKey,
  memberRefsToWireNames,
  rglMember,
  rxGroupListMembersEqual,
} from './entityRefs.ts';
import { parseTalkGroupSlotWireName } from './import/opengd77/collapseTalkGroupTimeslotDuplicates.ts';
import {
  normalizeTalkGroupNumber,
  talkGroupIdByNormalizedNumber,
} from './repeaterDirectories/brandmeister/mapTalkGroups.ts';

export type ChannelInput = Omit<Channel, 'id'>;

export type ZoneInput = Pick<Zone, 'name'> & { memberChannelIds?: string[] };

export type TalkGroupInput = Omit<TalkGroup, 'id'>;

export type ContactInput = Omit<Contact, 'id'>;

export type RxGroupListInput = Pick<RxGroupList, 'name'> & {
  memberRefs?: RxGroupListMember[];
};

function channelById(channels: Channel[], id: string): Channel | undefined {
  return channels.find((ch) => ch.id === id);
}

/** Map ordered channel ids to export wire names (skips missing ids). */
export function channelNamesForIds(channels: Channel[], ids: string[]): string[] {
  const names: string[] = [];
  for (const id of ids) {
    const ch = channelById(channels, id);
    if (ch) names.push(composeChannelWireName(ch));
  }
  return names;
}

export function zoneWithMemberIds(
  zone: Zone,
  memberChannelIds: string[],
  channels: Channel[],
): Zone {
  return setMemberWireNames(
    { ...zone, memberChannelIds },
    channelNamesForIds(channels, memberChannelIds),
  );
}

/** Refresh export wire names for all zones from current channel ids. */
export function refreshAllZoneSourceNames(codeplug: Codeplug): Zone[] {
  return codeplug.zones.map((zone) =>
    zoneWithMemberIds(zone, zone.memberChannelIds, codeplug.channels),
  );
}

/** Normalise multi-mode flags and sync primary profile ↔ top-level fields. */
export function normalizeChannelForSave(channel: Channel): Channel {
  if (!channel.multiMode) {
    return { ...channel, multiMode: false, modeProfiles: [] };
  }
  if (channel.modeProfiles.length === 0) {
    return { ...channel, multiMode: false, modeProfiles: [] };
  }
  return syncChannelFromPrimaryProfile(channel);
}

export function addChannel(codeplug: Codeplug, input: ChannelInput): Codeplug {
  const channel = normalizeChannelForSave({
    ...channelFieldDefaults(),
    ...input,
    id: newId(),
  });
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
  const updated = normalizeChannelForSave({
    ...existing,
    ...patch,
    id: channelId,
  });

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

function replaceZoneMemberIds(
  memberChannelIds: string[],
  survivorId: string,
  absorbedIds: Set<string>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of memberChannelIds) {
    const next = absorbedIds.has(id) ? survivorId : id;
    if (seen.has(next)) continue;
    seen.add(next);
    result.push(next);
  }
  return result;
}

/** Replace absorbed channel ids with survivor in zones, delete absorbed channels. */
export function mergeChannelsIntoOne(
  codeplug: Codeplug,
  survivorId: string,
  absorbedIds: string[],
  mergedChannel: Channel,
): Codeplug {
  const absorbed = new Set(absorbedIds);
  if (absorbed.has(survivorId)) {
    throw new Error('Survivor id cannot be among absorbed ids');
  }

  const normalized = normalizeChannelForSave({ ...mergedChannel, id: survivorId });
  const channels = codeplug.channels
    .filter((ch) => !absorbed.has(ch.id))
    .map((ch) => (ch.id === survivorId ? normalized : ch));

  const zones = codeplug.zones.map((zone) => {
    const memberChannelIds = replaceZoneMemberIds(zone.memberChannelIds, survivorId, absorbed);
    return zoneWithMemberIds(zone, memberChannelIds, channels);
  });

  const withChannels = { ...codeplug, channels, zones };
  return {
    ...withChannels,
    zones: refreshAllZoneSourceNames(withChannels),
  };
}

export function addZone(codeplug: Codeplug, input: ZoneInput): Codeplug {
  const memberChannelIds = input.memberChannelIds ?? [];
  const channelIds = new Set(codeplug.channels.map((ch) => ch.id));
  for (const id of memberChannelIds) {
    if (!channelIds.has(id)) {
      throw new Error(`Unknown channel id: ${id}`);
    }
  }

  const zone: Zone = zoneWithMemberIds(
    {
      id: newId(),
      name: input.name,
      memberChannelIds,
    },
    memberChannelIds,
    codeplug.channels,
  );
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

function removeMemberRefFromAllRgls(
  codeplug: Codeplug,
  kind: EntityRefKind,
  entityId: string,
): RxGroupList[] {
  return codeplug.rxGroupLists.map((rgl) => {
    const nextRefs = rgl.memberRefs.filter(
      (member) => !(member.ref.kind === kind && member.ref.id === entityId),
    );
    if (nextRefs.length === rgl.memberRefs.length) return rgl;
    return {
      ...rgl,
      memberRefs: nextRefs,
      ...syncRglMemberWireNames(rgl, nextRefs, codeplug),
    };
  });
}

function syncRglMemberWireNames(
  rgl: RxGroupList,
  memberRefs: RxGroupListMember[],
  codeplug: Codeplug,
): Pick<RxGroupList, 'meta'> {
  const names = memberRefsToWireNames(memberRefs, codeplug.talkGroups, codeplug.contacts);
  return { meta: setMemberWireNames(rgl, names).meta };
}

function dedupeRxGroupListMembers(members: RxGroupListMember[]): RxGroupListMember[] {
  const seen = new Set<string>();
  const out: RxGroupListMember[] = [];
  for (const member of members) {
    const key = `${entityRefKey(member.ref)}:${member.timeslot ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(member);
  }
  return out;
}

function mapMemberWireNames<T extends { meta?: import('./entityProvenance.ts').EntityMeta }>(
  entity: T,
  fn: (names: string[]) => string[],
): T {
  return setMemberWireNames(entity, fn(getMemberWireNames(entity)));
}

function propagateContactWireRename(
  codeplug: Codeplug,
  oldName: string,
  newName: string,
): Codeplug {
  const rxGroupLists = codeplug.rxGroupLists.map((rgl) =>
    mapMemberWireNames(rgl, (names) => names.map((n) => (n === oldName ? newName : n))),
  );
  return { ...codeplug, rxGroupLists };
}

function clearContactEntityReferences(
  codeplug: Codeplug,
  kind: EntityRefKind,
  entityId: string,
  wireName: string,
): Codeplug {
  const channels = codeplug.channels.map((ch) => {
    const ref = ch.contactRef;
    return ref && ref.kind === kind && ref.id === entityId ? { ...ch, contactRef: null } : ch;
  });
  const rxGroupLists = codeplug.rxGroupLists.map((rgl) =>
    mapMemberWireNames(rgl, (names) => names.filter((n) => n !== wireName)),
  );
  const rglsWithRefs = removeMemberRefFromAllRgls(
    { ...codeplug, channels, rxGroupLists },
    kind,
    entityId,
  );
  return { ...codeplug, channels, rxGroupLists: rglsWithRefs };
}

function clearRxGroupListReferences(codeplug: Codeplug, rglId: string): Codeplug {
  const channels = codeplug.channels.map((ch) =>
    ch.rxGroupListId === rglId ? { ...ch, rxGroupListId: null } : ch,
  );
  return { ...codeplug, channels };
}

function rewireTalkGroupContactRef(
  ref: { kind: 'talkGroup'; id: string } | { kind: 'contact'; id: string } | null,
  survivorId: string,
  absorbed: Set<string>,
): typeof ref {
  if (!ref || ref.kind !== 'talkGroup') return ref;
  if (ref.id === survivorId) return ref;
  if (absorbed.has(ref.id)) return { kind: 'talkGroup', id: survivorId };
  return ref;
}

/** Replace absorbed talk group ids with survivor; rewire RGL member slots and channel refs. */
export function mergeTalkGroupsIntoOne(
  codeplug: Codeplug,
  survivorId: string,
  absorbedIds: string[],
  mergedTalkGroup: TalkGroup,
): Codeplug {
  const absorbed = new Set(absorbedIds);
  if (absorbed.has(survivorId)) {
    throw new Error('Survivor id cannot be among absorbed ids');
  }

  const survivor = codeplug.talkGroups.find((tg) => tg.id === survivorId);
  if (!survivor) return codeplug;

  const talkGroups = codeplug.talkGroups
    .filter((tg) => !absorbed.has(tg.id))
    .map((tg) =>
      tg.id === survivorId
        ? { ...mergedTalkGroup, id: survivorId, name: mergedTalkGroup.name.trim() }
        : tg,
    );

  const channels = codeplug.channels.map((ch) => {
    const contactRef = rewireTalkGroupContactRef(ch.contactRef, survivorId, absorbed);
    const modeProfiles =
      ch.modeProfiles.length > 0
        ? ch.modeProfiles.map((profile) => ({
            ...profile,
            contactRef: rewireTalkGroupContactRef(profile.contactRef, survivorId, absorbed),
          }))
        : ch.modeProfiles;
    if (contactRef === ch.contactRef && modeProfiles === ch.modeProfiles) return ch;
    return { ...ch, contactRef, modeProfiles };
  });

  const rxGroupLists = codeplug.rxGroupLists.map((rgl) => {
    const sourceIds = new Set([survivorId, ...absorbedIds]);
    const memberRefs = dedupeRxGroupListMembers(
      rgl.memberRefs.flatMap((member) => {
        if (member.ref.kind !== 'talkGroup') return [member];
        const id = member.ref.id;
        if (!sourceIds.has(id)) return [member];
        const tg = codeplug.talkGroups.find((t) => t.id === id);
        const slot = member.timeslot ?? (tg ? parseTalkGroupSlotWireName(tg.name).slot : null);
        return [rglMember({ kind: 'talkGroup', id: survivorId }, slot)];
      }),
    );
    if (rxGroupListMembersEqual(rgl.memberRefs, memberRefs)) return rgl;
    return {
      ...rgl,
      memberRefs,
      ...syncRglMemberWireNames(rgl, memberRefs, { ...codeplug, talkGroups, channels }),
    };
  });

  let next: Codeplug = { ...codeplug, talkGroups, channels, rxGroupLists };
  if (mergedTalkGroup.name !== survivor.name) {
    next = propagateContactWireRename(next, survivor.name, mergedTalkGroup.name);
  }
  return next;
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
  return clearContactEntityReferences(next, 'talkGroup', talkGroupId, talkGroup.name);
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
  return clearContactEntityReferences(next, 'contact', contactId, contact.name);
}

export function addRxGroupList(codeplug: Codeplug, input: RxGroupListInput): Codeplug {
  const memberRefs = dedupeRxGroupListMembers(input.memberRefs ?? []);
  const base: RxGroupList = {
    id: newId(),
    name: input.name.trim(),
    memberRefs,
  };
  const rgl = setMemberWireNames(
    base,
    memberRefsToWireNames(memberRefs, codeplug.talkGroups, codeplug.contacts),
  );
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
  const memberRefs =
    patch.memberRefs !== undefined
      ? dedupeRxGroupListMembers(patch.memberRefs)
      : existing.memberRefs;
  const updated: RxGroupList = {
    ...existing,
    name,
    memberRefs,
    ...syncRglMemberWireNames(existing, memberRefs, codeplug),
  };

  const rxGroupLists = [...codeplug.rxGroupLists];
  rxGroupLists[index] = updated;

  return { ...codeplug, rxGroupLists };
}

export function deleteRxGroupList(codeplug: Codeplug, rglId: string): Codeplug {
  const rgl = codeplug.rxGroupLists.find((r) => r.id === rglId);
  if (!rgl) return codeplug;

  const next: Codeplug = {
    ...codeplug,
    rxGroupLists: codeplug.rxGroupLists.filter((r) => r.id !== rglId),
  };
  return clearRxGroupListReferences(next, rglId);
}

export function setRxGroupListMembers(
  codeplug: Codeplug,
  rglId: string,
  memberRefs: RxGroupListMember[],
): Codeplug {
  const refs = dedupeRxGroupListMembers(memberRefs);
  const rxGroupLists = codeplug.rxGroupLists.map((rgl) => {
    if (rgl.id !== rglId) return rgl;
    return {
      ...rgl,
      memberRefs: refs,
      ...syncRglMemberWireNames(rgl, refs, codeplug),
    };
  });
  return { ...codeplug, rxGroupLists };
}

export interface BrandMeisterRxListMemberSpec {
  number: string;
  timeslot: import('./channelFields/index.ts').ChannelTimeslot | null;
}

export interface BrandMeisterRepeaterBundleInput {
  newTalkGroups: TalkGroupInput[];
  rxListName: string;
  rxListMembers: BrandMeisterRxListMemberSpec[];
  channel: ChannelInput;
}

/** Atomically add talk groups, optional RX list, and channel for BrandMeister import. */
export function addBrandMeisterRepeaterBundle(
  codeplug: Codeplug,
  input: BrandMeisterRepeaterBundleInput,
): Codeplug {
  let cp = codeplug;
  const idByNumber = talkGroupIdByNormalizedNumber(cp.talkGroups);

  for (const tgInput of input.newTalkGroups) {
    cp = addTalkGroup(cp, tgInput);
    const added = cp.talkGroups[cp.talkGroups.length - 1];
    const key = normalizeTalkGroupNumber(added.number);
    if (key) idByNumber.set(key, added.id);
  }

  let rxGroupListId: string | null = null;
  if (input.rxListMembers.length > 0) {
    const memberRefs: RxGroupListMember[] = [];
    for (const spec of input.rxListMembers) {
      const key = normalizeTalkGroupNumber(spec.number);
      const id = key ? idByNumber.get(key) : undefined;
      if (!id) continue;
      memberRefs.push({
        ref: { kind: 'talkGroup', id },
        timeslot: spec.timeslot,
      });
    }
    if (memberRefs.length > 0) {
      cp = addRxGroupList(cp, { name: input.rxListName, memberRefs });
      rxGroupListId = cp.rxGroupLists[cp.rxGroupLists.length - 1]?.id ?? null;
    }
  }

  return addChannel(cp, { ...input.channel, rxGroupListId });
}

export interface BrandMeisterRxListCorrectionInput {
  newTalkGroups: TalkGroupInput[];
  rxListMembers: BrandMeisterRxListMemberSpec[];
  action: 'update' | 'create';
  existingRxGroupListId?: string | null;
  newListName: string;
}

export interface BrandMeisterRxListCorrectionResult {
  codeplug: Codeplug;
  rxGroupListId: string | null;
}

/** Add missing talk groups and update or create an RX group list from BrandMeister static TGs. */
export function applyBrandMeisterRxListCorrection(
  codeplug: Codeplug,
  input: BrandMeisterRxListCorrectionInput,
): BrandMeisterRxListCorrectionResult {
  let cp = codeplug;
  const idByNumber = talkGroupIdByNormalizedNumber(cp.talkGroups);

  for (const tgInput of input.newTalkGroups) {
    cp = addTalkGroup(cp, tgInput);
    const added = cp.talkGroups[cp.talkGroups.length - 1];
    const key = normalizeTalkGroupNumber(added.number);
    if (key) idByNumber.set(key, added.id);
  }

  const memberRefs: RxGroupListMember[] = [];
  for (const spec of input.rxListMembers) {
    const key = normalizeTalkGroupNumber(spec.number);
    const id = key ? idByNumber.get(key) : undefined;
    if (!id) continue;
    memberRefs.push({
      ref: { kind: 'talkGroup', id },
      timeslot: spec.timeslot,
    });
  }

  if (memberRefs.length === 0) {
    return { codeplug: cp, rxGroupListId: input.existingRxGroupListId ?? null };
  }

  if (input.action === 'update' && input.existingRxGroupListId) {
    cp = setRxGroupListMembers(cp, input.existingRxGroupListId, memberRefs);
    return { codeplug: cp, rxGroupListId: input.existingRxGroupListId };
  }

  cp = addRxGroupList(cp, { name: input.newListName, memberRefs });
  const rxGroupListId = cp.rxGroupLists[cp.rxGroupLists.length - 1]?.id ?? null;
  return { codeplug: cp, rxGroupListId };
}
