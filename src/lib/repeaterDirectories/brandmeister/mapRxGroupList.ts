import type { RxGroupListInput, RxGroupListMember } from '../../../models/codeplug.ts';
import type { ChannelTimeslot } from '../../channelFields/index.ts';
import type { BrandMeisterDevice } from './types.ts';
import type { BrandMeisterStaticTalkgroup } from './types.ts';
import { staticTalkgroupSlots } from './mapTalkGroups.ts';

export function repeaterRxGroupListName(device: BrandMeisterDevice): string {
  const callsign = device.callsign.trim();
  return callsign ? `${callsign} RX` : 'Repeater RX';
}

export function buildRepeaterRxGroupListInput(
  device: BrandMeisterDevice,
  staticTalkgroups: BrandMeisterStaticTalkgroup[],
  idByNumber: Map<string, string>,
): RxGroupListInput | null {
  const slots = staticTalkgroupSlots(staticTalkgroups);
  const memberRefs: RxGroupListMember[] = [];

  for (const { number, timeslot } of slots) {
    const id = idByNumber.get(number);
    if (!id) continue;
    memberRefs.push({
      ref: { kind: 'talkGroup', id },
      timeslot: timeslot as ChannelTimeslot | null,
    });
  }

  if (memberRefs.length === 0) return null;

  return {
    name: repeaterRxGroupListName(device),
    memberRefs,
  };
}
