import {
  effectiveMaxNameLength,
  expandOptionsFromExport,
} from '../../channelExpansion/exportOptions.ts';
import {
  buildTalkGroupWireContactMap,
  expandedWireNameForRglMember,
  serialiseTalkGroupContactsForExport,
  type TalkGroupWireContactMap,
} from '../../channelExpansion/talkGroupTimeslotExpansion.ts';
import { expandZoneMemberWireNames } from '../../channelExpansion/index.ts';
import { isDmrMode } from '../../channelModes.ts';
import type { Codeplug, RxGroupList } from '../../../models/codeplug.ts';
import type { ExportOptions } from '../../import-export/types.ts';
import { findContactById, findTalkGroupById } from '../../entityRefs.ts';
import { getOpenGd77Profile, DEFAULT_OPENGD77_PROFILE_ID } from '../../opengd77/profiles.ts';

export function openGd77TalkGroupWireMap(
  codeplug: Codeplug,
  options?: ExportOptions,
  warnings?: string[],
): TalkGroupWireContactMap {
  const profile = getOpenGd77Profile(options?.profileId ?? DEFAULT_OPENGD77_PROFILE_ID);
  const reserved = new Set<string>();
  for (const tg of codeplug.talkGroups) {
    if (tg.name.trim()) reserved.add(tg.name.trim());
  }
  for (const c of codeplug.contacts) {
    if (c.name.trim()) reserved.add(c.name.trim());
  }
  return buildTalkGroupWireContactMap(codeplug, {
    maxNameLength: effectiveMaxNameLength(options, profile.nameLimit),
    reservedWireNames: reserved,
    warnings,
  });
}

/** Zone member channel names for OpenGD77 export — expands multi-mode members. */
export function zoneExportMemberNames(
  zone: { memberChannelIds: string[]; name: string },
  codeplug: Codeplug,
  options?: ExportOptions,
): string[] {
  const profile = getOpenGd77Profile(options?.profileId ?? DEFAULT_OPENGD77_PROFILE_ID);
  const expandOpts = expandOptionsFromExport(codeplug, options);
  const { names } = expandZoneMemberWireNames(
    { id: '', name: zone.name, memberChannelIds: zone.memberChannelIds },
    codeplug.channels,
    {
      ...expandOpts,
      maxNameLength: effectiveMaxNameLength(options, profile.nameLimit),
      maxMembers: profile.zoneMembers,
    },
  );
  return names;
}

/** RX group list member wire names for OpenGD77 export — resolves TG×TS expansion. */
export function rxGroupListExportMemberNames(
  rgl: RxGroupList,
  codeplug: Codeplug,
  talkGroupWireMap: TalkGroupWireContactMap,
): string[] {
  const names: string[] = [];
  for (const member of rgl.memberRefs) {
    const name = expandedWireNameForRglMember(member, codeplug, talkGroupWireMap);
    if (name) names.push(name);
  }
  return names;
}

export function channelContactWireNameForOpenGd77Export(
  channel: {
    contactRef: Codeplug['channels'][0]['contactRef'];
    mode: Codeplug['channels'][0]['mode'];
  },
  codeplug: Codeplug,
): string {
  const ref = channel.contactRef;
  if (!ref) return isDmrMode(channel.mode) ? 'None' : '';
  if (ref.kind === 'talkGroup') {
    return findTalkGroupById(ref.id, codeplug.talkGroups)?.name ?? '';
  }
  return findContactById(ref.id, codeplug.contacts)?.name ?? '';
}

export { serialiseTalkGroupContactsForExport };
