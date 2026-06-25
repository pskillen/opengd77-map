import type { Codeplug, RxGroupListMember, TalkGroup } from '../../../models/codeplug.ts';
import type { ExportOptions } from '../../import-export/types.ts';
import { effectiveMaxNameLength } from '../../channelExpansion/exportOptions.ts';
import { finalizeWireName } from '../../channelExpansion/shortenName.ts';
import {
  contactRefWireNameForExport,
  entityRefDisplayName,
  type ChannelContactExportSource,
} from '../../entityRefs.ts';
import { DEFAULT_DM32_PROFILE_ID, getDm32Profile } from '../../dm32/profiles.ts';

export type Dm32TalkGroupWireNameMap = ReadonlyMap<string, string>;

function dm32TalkGroupNameLimit(options: ExportOptions | undefined, profileId: string): number {
  const profile = getDm32Profile(profileId);
  return effectiveMaxNameLength(options, profile.nameLimit);
}

/**
 * Resolve one talk-group wire name for DM-32 `Talkgroups.csv` (and FK columns that reference it).
 * When the stored name exceeds the profile limit, use `TalkGroup.abbreviation` then the shared
 * shortening pipeline.
 */
export function talkGroupWireNameForDm32Export(
  tg: TalkGroup,
  maxLen: number,
  reserved: Set<string>,
  warnings?: string[],
): string {
  let base = tg.name.trim();
  if (base.length > maxLen) {
    const abbrev = tg.abbreviation?.trim();
    if (abbrev) base = abbrev;
  }

  return finalizeWireName(
    base,
    reserved,
    maxLen,
    { allowCallsignSuffixDowngrade: false },
    warnings,
  );
}

/** Build stable talk-group id → DM-32 wire name map for one export pass. */
export function buildDm32TalkGroupWireNameMap(
  talkGroups: readonly TalkGroup[],
  options?: ExportOptions,
  warnings?: string[],
): Map<string, string> {
  const profileId = options?.profileId ?? DEFAULT_DM32_PROFILE_ID;
  const maxLen = dm32TalkGroupNameLimit(options, profileId);
  const reserved = new Set<string>();
  const map = new Map<string, string>();

  for (const tg of talkGroups) {
    map.set(tg.id, talkGroupWireNameForDm32Export(tg, maxLen, reserved, warnings));
  }

  return map;
}

export function dm32TalkGroupWireNameFromMap(
  talkGroupId: string,
  map: Dm32TalkGroupWireNameMap,
): string | undefined {
  return map.get(talkGroupId);
}

export function dm32ContactRefWireNameForExport(
  channel: ChannelContactExportSource,
  codeplug: Codeplug,
  talkGroupWireNames: Dm32TalkGroupWireNameMap,
): string {
  const ref = channel.contactRef;
  if (ref?.kind === 'talkGroup') {
    const wire = talkGroupWireNames.get(ref.id);
    if (wire) return wire;
  }
  return contactRefWireNameForExport(channel, codeplug);
}

export function dm32RxGroupListMemberWireName(
  member: RxGroupListMember,
  codeplug: Codeplug,
  talkGroupWireNames: Dm32TalkGroupWireNameMap,
): string | null {
  const ref = member.ref;
  if (ref.kind === 'talkGroup') {
    return talkGroupWireNames.get(ref.id) ?? null;
  }
  return entityRefDisplayName(ref, codeplug.talkGroups, codeplug.contacts);
}
