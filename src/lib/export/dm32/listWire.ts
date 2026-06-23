import type { Codeplug, RxGroupList } from '../../../models/codeplug.ts';
import { memberRefsToWireNames } from '../../entityRefs.ts';
import {
  expandZoneMemberWireNames,
  type ExpandChannelOptions,
} from '../../channelExpansion/index.ts';

export function rxGroupListExportMemberNames(list: RxGroupList, codeplug: Codeplug): string[] {
  return memberRefsToWireNames(list.memberRefs, codeplug.talkGroups, codeplug.contacts);
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
