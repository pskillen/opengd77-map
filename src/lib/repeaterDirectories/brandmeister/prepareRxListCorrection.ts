import type { Codeplug, RxGroupList, RxGroupListMember } from '../../../models/codeplug.ts';
import type { TalkGroupInput } from '../../codeplugMutations.ts';
import { fetchStaticTalkgroups } from './client.ts';
import { diffRxGroupListFromBrandMeister } from './rxListDiff.ts';
import type { EntityDiffRow } from './entityDiff.ts';
import { entityDiffHasChanges } from './entityDiff.ts';
import { repeaterRxGroupListName } from './mapRxGroupList.ts';
import {
  resolveTalkGroupsFromStatic,
  staticTalkgroupSlots,
  talkGroupIdByNormalizedNumber,
} from './mapTalkGroups.ts';
import type { BrandMeisterDevice } from './types.ts';

export interface RxListCorrectionPlan {
  suggestedName: string;
  newTalkGroups: TalkGroupInput[];
  memberRefs: RxGroupListMember[];
  diffRows: EntityDiffRow[];
  hasRxListChanges: boolean;
  warnings: string[];
}

export async function prepareRxListCorrection(
  codeplug: Codeplug,
  device: BrandMeisterDevice,
  rxGroupList: RxGroupList | null,
): Promise<RxListCorrectionPlan | null> {
  const staticTalkgroups = await fetchStaticTalkgroups(device.id);
  if (staticTalkgroups.length === 0) {
    return null;
  }

  const diffRows = rxGroupList
    ? diffRxGroupListFromBrandMeister(rxGroupList, staticTalkgroups, codeplug)
    : [
        {
          field: 'members',
          label: 'Static talk groups',
          local: '—',
          remote: staticTalkgroupSlots(staticTalkgroups)
            .map((s) => `TG ${s.number}${s.timeslot ? ` TS${s.timeslot}` : ''}`)
            .join(', '),
          changed: true,
        },
      ];

  const resolved = await resolveTalkGroupsFromStatic(staticTalkgroups, codeplug.talkGroups);
  const warnings = [...resolved.warnings];

  const idByNumber = talkGroupIdByNormalizedNumber(codeplug.talkGroups);
  for (const [number, id] of resolved.idByNumber) {
    idByNumber.set(number, id);
  }

  const memberRefs: RxGroupListMember[] = [];
  for (const { number, timeslot } of staticTalkgroupSlots(staticTalkgroups)) {
    const id = idByNumber.get(number);
    if (!id) continue;
    memberRefs.push({ ref: { kind: 'talkGroup', id }, timeslot });
  }

  const hasResolvableMembers = memberRefs.length > 0 || resolved.newTalkGroups.length > 0;
  if (!hasResolvableMembers) {
    warnings.push('No local talk groups match repeater static IDs — nothing to apply.');
  }

  return {
    suggestedName: repeaterRxGroupListName(device),
    newTalkGroups: resolved.newTalkGroups,
    memberRefs,
    diffRows,
    hasRxListChanges: entityDiffHasChanges(diffRows),
    warnings,
  };
}
