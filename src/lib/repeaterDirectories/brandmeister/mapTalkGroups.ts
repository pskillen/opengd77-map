import type { TalkGroup } from '../../../models/codeplug.ts';
import type { TalkGroupInput } from '../../codeplugMutations.ts';
import type { ChannelTimeslot } from '../../channelFields/index.ts';
import type { BrandMeisterStaticTalkgroup } from './types.ts';

/** DMR talk group ID for identity matching (numeric; ignores leading zeros). */
export function normalizeTalkGroupNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const n = Number.parseInt(trimmed, 10);
    if (Number.isFinite(n) && n >= 0) return String(n);
  }
  return trimmed;
}

/** Map normalized DMR talk group number → internal talk group id (first wins). */
export function talkGroupIdByNormalizedNumber(talkGroups: TalkGroup[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const tg of talkGroups) {
    const key = normalizeTalkGroupNumber(tg.number);
    if (key && !map.has(key)) map.set(key, tg.id);
  }
  return map;
}

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

export async function resolveTalkGroupsFromStatic(
  staticTalkgroups: BrandMeisterStaticTalkgroup[],
  existingTalkGroups: TalkGroup[],
): Promise<ResolvedTalkGroups> {
  const warnings: string[] = [];
  const byNumber = talkGroupIdByNormalizedNumber(existingTalkGroups);

  const newTalkGroups: TalkGroupInput[] = [];
  const idByNumber = new Map<string, string>();

  const seen = new Set<string>();
  for (const entry of staticTalkgroups) {
    const number = normalizeTalkGroupNumber(entry.talkgroup);
    if (!number || seen.has(number)) continue;
    seen.add(number);

    const existingId = byNumber.get(number);
    if (existingId) {
      idByNumber.set(number, existingId);
      continue;
    }

    newTalkGroups.push({
      name: `TG ${number}`,
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
    const number = normalizeTalkGroupNumber(entry.talkgroup);
    if (!number || seen.has(number)) continue;
    seen.add(number);
    result.push({ number, timeslot: parseSlot(entry.slot) });
  }
  return result;
}
