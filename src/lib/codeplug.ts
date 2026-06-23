import type { Channel, Codeplug } from '../models/codeplug.ts';
import { channelImportMergeKeys, composeChannelWireName } from './channelNaming.ts';
import {
  expandAllChannelsForExport,
  modeExportNameSuffix,
  resolveChannelModeProfiles,
  type TalkGroupMemberFilter,
} from './channelExpansion/index.ts';

export interface BuildNameToChannelIdOptions {
  /** When set with expandTalkGroups, register TG-expanded wire name aliases. */
  codeplug?: Codeplug;
  expandTalkGroups?: boolean;
  talkGroupMembers?: TalkGroupMemberFilter;
}

/** Case-sensitive, first-wins name → channel id map (OpenGD77 quirk at import boundary only). */
export function buildNameToChannelId(
  channels: Channel[],
  options: BuildNameToChannelIdOptions = {},
): Map<string, string> {
  const map = new Map<string, string>();
  for (const ch of channels) {
    for (const key of channelImportMergeKeys(ch)) {
      if (!map.has(key)) map.set(key, ch.id);
    }
    const base = composeChannelWireName(ch);
    if (!map.has(base)) map.set(base, ch.id);
    if (ch.multiMode) {
      for (const profile of resolveChannelModeProfiles(ch)) {
        const alias = `${base}${modeExportNameSuffix(profile.mode)}`;
        if (!map.has(alias)) map.set(alias, ch.id);
      }
    }
  }

  if (options.expandTalkGroups && options.codeplug) {
    const expanded = expandAllChannelsForExport(channels, {
      expandTalkGroups: true,
      talkGroupMembers: options.talkGroupMembers,
      codeplug: options.codeplug,
    });
    for (const row of expanded) {
      if (!map.has(row.wireName)) map.set(row.wireName, row.sourceChannelId);
    }
  }

  return map;
}

export function resolveZoneMembers(
  sourceMemberNames: string[],
  nameToId: Map<string, string>,
): { memberChannelIds: string[]; unresolved: string[] } {
  const memberChannelIds: string[] = [];
  const unresolved: string[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const memberName of sourceMemberNames) {
    if (seenNames.has(memberName)) continue;
    seenNames.add(memberName);

    const id = nameToId.get(memberName);
    if (!id) {
      unresolved.push(memberName);
      continue;
    }
    if (!seenIds.has(id)) {
      seenIds.add(id);
      memberChannelIds.push(id);
    }
  }

  return { memberChannelIds, unresolved };
}
