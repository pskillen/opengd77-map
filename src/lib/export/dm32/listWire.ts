import type { Codeplug, RxGroupList } from '../../../models/codeplug.ts';
import { memberRefsToWireNames } from '../../entityRefs.ts';
import {
  expandZoneMemberWireNames,
  type ExpandChannelOptions,
} from '../../channelExpansion/index.ts';
import { dm32RxGroupListMemberWireName, type Dm32TalkGroupWireNameMap } from './talkGroupWire.ts';

export function rxGroupListExportMemberNames(
  list: RxGroupList,
  codeplug: Codeplug,
  talkGroupWireNames?: Dm32TalkGroupWireNameMap,
): string[] {
  if (!talkGroupWireNames) {
    return memberRefsToWireNames(list.memberRefs, codeplug.talkGroups, codeplug.contacts);
  }
  const names: string[] = [];
  for (const member of list.memberRefs) {
    const name = dm32RxGroupListMemberWireName(member, codeplug, talkGroupWireNames);
    if (name) names.push(name);
  }
  return names;
}

export function zoneExportMemberNames(
  zone: { memberChannelIds: string[]; name: string },
  channels: Codeplug['channels'],
  expandOptions: ExpandChannelOptions,
): string[] {
  const { names } = expandZoneMemberWireNames(
    { id: '', name: zone.name, memberChannelIds: zone.memberChannelIds },
    channels,
    expandOptions,
  );
  return names;
}
