import type { TalkGroup, TalkGroupInput } from '../../../models/codeplug.ts';
import type { ChannelTimeslot } from '../../channelFields/index.ts';
import { fetchTalkgroupMeta } from './client.ts';
import type { BrandMeisterStaticTalkgroup } from './types.ts';

export interface ResolvedTalkGroups {
  /** Talk groups to create — existing numbers omitted. */
  newTalkGroups: TalkGroupInput[];
  /** DMR talk group id → internal UUID (existing + will-be-created placeholders). */
  idByNumber: Map<string, string>;
  warnings: string[];
}

function parseSlot(slot: string): ChannelTimeslot | null {
  if (slot === '1') return 1;
  if (slot === '2') return 2;
  return null;
}

function talkGroupNameForNumber(number: string, metaName: string | undefined): string {
  const trimmed = metaName?.trim();
  if (trimmed) return trimmed;
  return `TG ${number}`;
}

export async function resolveTalkGroupsFromStatic(
  staticTalkgroups: BrandMeisterStaticTalkgroup[],
  existingTalkGroups: TalkGroup[],
): Promise<ResolvedTalkGroups> {
  const warnings: string[] = [];
  const byNumber = new Map<string, TalkGroup>();
  for (const tg of existingTalkGroups) {
    const key = tg.number.trim();
    if (key) byNumber.set(key, tg);
  }

  const newTalkGroups: TalkGroupInput[] = [];
  const idByNumber = new Map<string, string>();

  const seen = new Set<string>();
  for (const entry of staticTalkgroups) {
    const number = entry.talkgroup.trim();
    if (!number || seen.has(number)) continue;
    seen.add(number);

    const existing = byNumber.get(number);
    if (existing) {
      idByNumber.set(number, existing.id);
      continue;
    }

    let metaName: string | undefined;
    try {
      const meta = await fetchTalkgroupMeta(number);
      metaName = meta?.Name;
    } catch {
      warnings.push(`Could not fetch name for talk group ${number}`);
    }

    newTalkGroups.push({
      name: talkGroupNameForNumber(number, metaName),
      number,
      callType: 'group',
    });
  }

  return { newTalkGroups, idByNumber, warnings };
}

/** Assign ids for talk groups about to be created (caller supplies newId per input). */
export function assignNewTalkGroupIds(
  newTalkGroups: TalkGroupInput[],
  createId: () => string,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const input of newTalkGroups) {
    map.set(input.number.trim(), createId());
  }
  return map;
}

export function staticTalkgroupSlots(
  staticTalkgroups: BrandMeisterStaticTalkgroup[],
): Array<{ number: string; timeslot: ChannelTimeslot | null }> {
  const seen = new Set<string>();
  const result: Array<{ number: string; timeslot: ChannelTimeslot | null }> = [];
  for (const entry of staticTalkgroups) {
    const number = entry.talkgroup.trim();
    if (!number || seen.has(number)) continue;
    seen.add(number);
    result.push({ number, timeslot: parseSlot(entry.slot) });
  }
  return result;
}
