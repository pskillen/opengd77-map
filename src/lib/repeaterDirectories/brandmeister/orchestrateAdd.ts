import type { Codeplug } from '../../../models/codeplug.ts';
import type { ChannelInput } from '../../codeplugMutations.ts';
import type { EntityMeta } from '../../../models/codeplug.ts';
import { fetchStaticTalkgroups } from './client.ts';
import { buildRepeaterRxGroupListInput, repeaterRxGroupListName } from './mapRxGroupList.ts';
import { resolveTalkGroupsFromStatic, staticTalkgroupSlots } from './mapTalkGroups.ts';
import type { BrandMeisterDevice } from './types.ts';
import type { BrandMeisterRepeaterBundleInput } from '../../codeplugMutations.ts';

export interface BrandMeisterBundlePlan {
  bundle: BrandMeisterRepeaterBundleInput;
  warnings: string[];
}

export async function buildBrandMeisterBundlePlan(
  codeplug: Codeplug,
  device: BrandMeisterDevice,
  channelInput: ChannelInput,
  channelMeta: EntityMeta,
  includeTalkGroupsAndRxList: boolean,
): Promise<BrandMeisterBundlePlan> {
  const warnings: string[] = [];
  const channel: ChannelInput = { ...channelInput, meta: channelMeta };

  if (!includeTalkGroupsAndRxList) {
    return {
      bundle: {
        newTalkGroups: [],
        rxListName: repeaterRxGroupListName(device),
        rxListMembers: [],
        channel,
      },
      warnings,
    };
  }

  const staticTalkgroups = await fetchStaticTalkgroups(device.id);
  if (staticTalkgroups.length === 0) {
    warnings.push('No static talk groups on this device — channel added without RX list.');
    return {
      bundle: {
        newTalkGroups: [],
        rxListName: repeaterRxGroupListName(device),
        rxListMembers: [],
        channel,
      },
      warnings,
    };
  }

  const resolved = await resolveTalkGroupsFromStatic(staticTalkgroups, codeplug.talkGroups);
  warnings.push(...resolved.warnings);

  const idByNumber = new Map(resolved.idByNumber);
  const rxListInput = buildRepeaterRxGroupListInput(device, staticTalkgroups, idByNumber);
  const rxListMembers = staticTalkgroupSlots(staticTalkgroups).map(({ number, timeslot }) => ({
    number,
    timeslot,
  }));

  return {
    bundle: {
      newTalkGroups: resolved.newTalkGroups,
      rxListName: rxListInput?.name ?? repeaterRxGroupListName(device),
      rxListMembers: rxListInput ? rxListMembers : [],
      channel,
    },
    warnings,
  };
}
