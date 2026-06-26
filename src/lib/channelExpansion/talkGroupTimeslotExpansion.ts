import type { ChannelTimeslot } from '../channelFields/index.ts';
import { finalizeWireName } from './shortenName.ts';
import type { Codeplug, RxGroupListMember, TalkGroup } from '../../models/codeplug.ts';
import type { EntityRef } from '../entityRefs.ts';
import { findContactById, findTalkGroupById } from '../entityRefs.ts';

export interface ExpandedTalkGroupWireContact {
  talkGroupId: string;
  timeslot: ChannelTimeslot;
  wireName: string;
  tsOverrideWire: string;
}

export type TalkGroupWireContactMap = ReadonlyMap<string, ExpandedTalkGroupWireContact>;

function mapKey(talkGroupId: string, timeslot: ChannelTimeslot): string {
  return `${talkGroupId}:${timeslot}`;
}

/** Compose slot-suffixed wire contact name: `{logicalName} T{slot}`. */
export function composeTalkGroupTimeslotWireName(
  logicalName: string,
  timeslot: ChannelTimeslot,
): string {
  const base = logicalName.trim();
  return base ? `${base} T${timeslot}` : `T${timeslot}`;
}

function collectSlotDemand(codeplug: Codeplug): Map<string, Set<ChannelTimeslot>> {
  const demand = new Map<string, Set<ChannelTimeslot>>();

  const add = (talkGroupId: string, slot: ChannelTimeslot | null | undefined) => {
    if (slot !== 1 && slot !== 2) return;
    const set = demand.get(talkGroupId) ?? new Set<ChannelTimeslot>();
    set.add(slot);
    demand.set(talkGroupId, set);
  };

  for (const rgl of codeplug.rxGroupLists) {
    for (const member of rgl.memberRefs) {
      if (member.ref.kind !== 'talkGroup') continue;
      add(member.ref.id, member.timeslot);
    }
  }

  return demand;
}

export interface BuildTalkGroupWireContactMapOptions {
  maxNameLength?: number;
  reservedWireNames?: ReadonlySet<string>;
  warnings?: string[];
}

/**
 * Build expanded talk-group wire contacts for CPS export (OpenGD77 Contacts.csv).
 * One row per (logical talk group id, timeslot) pair in demand.
 */
export function buildTalkGroupWireContactMap(
  codeplug: Codeplug,
  options: BuildTalkGroupWireContactMapOptions = {},
): TalkGroupWireContactMap {
  const demand = collectSlotDemand(codeplug);
  const reserved = new Set(options.reservedWireNames ?? []);
  const map = new Map<string, ExpandedTalkGroupWireContact>();

  for (const tg of codeplug.talkGroups) {
    const slots = demand.get(tg.id);
    if (!slots || slots.size === 0) {
      const logical = tg.name.trim();
      if (logical) reserved.add(logical);
      continue;
    }

    for (const timeslot of [...slots].sort()) {
      const base = composeTalkGroupTimeslotWireName(tg.name, timeslot);
      const maxLen = options.maxNameLength;
      const wireName =
        maxLen != null
          ? finalizeWireName(base, reserved, maxLen, undefined, options.warnings)
          : (() => {
              let candidate = base;
              let n = 2;
              while (reserved.has(candidate)) {
                candidate = `${base} ${n}`;
                n++;
              }
              reserved.add(candidate);
              return candidate;
            })();

      if (maxLen != null) reserved.add(wireName);

      map.set(mapKey(tg.id, timeslot), {
        talkGroupId: tg.id,
        timeslot,
        wireName,
        tsOverrideWire: String(timeslot),
      });
    }
  }

  return map;
}

export function expandedTalkGroupWireName(
  talkGroupId: string,
  timeslot: ChannelTimeslot | null | undefined,
  map: TalkGroupWireContactMap,
  fallbackLogicalName: string,
): string {
  if (timeslot === 1 || timeslot === 2) {
    const expanded = map.get(mapKey(talkGroupId, timeslot));
    if (expanded) return expanded.wireName;
  }
  return fallbackLogicalName;
}

export function expandedWireNameForRglMember(
  member: RxGroupListMember,
  codeplug: Codeplug,
  map: TalkGroupWireContactMap,
): string | null {
  const ref = member.ref;
  if (ref.kind === 'talkGroup') {
    const logical = findTalkGroupById(ref.id, codeplug.talkGroups)?.name;
    if (!logical) return null;
    return expandedTalkGroupWireName(ref.id, member.timeslot, map, logical);
  }
  return findContactById(ref.id, codeplug.contacts)?.name ?? null;
}

export function expandedWireNameForContactRef(
  contactRef: EntityRef | null,
  codeplug: Codeplug,
  map: TalkGroupWireContactMap,
  channelTimeslot: ChannelTimeslot | null,
): string {
  if (!contactRef) return '';
  if (contactRef.kind === 'talkGroup') {
    const logical = findTalkGroupById(contactRef.id, codeplug.talkGroups)?.name ?? '';
    return expandedTalkGroupWireName(contactRef.id, channelTimeslot, map, logical);
  }
  return findContactById(contactRef.id, codeplug.contacts)?.name ?? '';
}

/** Logical talk groups with no slot demand emit one Contacts.csv row as-is. */
export function serialiseTalkGroupContactsForExport(
  talkGroups: TalkGroup[],
  map: TalkGroupWireContactMap,
): Array<{ talkGroup: TalkGroup; wireName: string; tsOverride: string }> {
  const expandedIds = new Set<string>();
  for (const entry of map.values()) {
    expandedIds.add(entry.talkGroupId);
  }

  const rows: Array<{ talkGroup: TalkGroup; wireName: string; tsOverride: string }> = [];

  for (const entry of map.values()) {
    const tg = talkGroups.find((t) => t.id === entry.talkGroupId);
    if (!tg) continue;
    rows.push({ talkGroup: tg, wireName: entry.wireName, tsOverride: entry.tsOverrideWire });
  }

  for (const tg of talkGroups) {
    if (expandedIds.has(tg.id)) continue;
    rows.push({ talkGroup: tg, wireName: tg.name, tsOverride: 'Disabled' });
  }

  return rows;
}
