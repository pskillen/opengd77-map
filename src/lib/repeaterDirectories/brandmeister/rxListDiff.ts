import type { ChannelTimeslot } from '../../channelFields/index.ts';
import type { Codeplug, RxGroupList } from '../../../models/codeplug.ts';
import type { BrandMeisterStaticTalkgroup } from './types.ts';
import { normalizeTalkGroupNumber, staticTalkgroupSlots } from './mapTalkGroups.ts';
import type { EntityDiffRow } from './entityDiff.ts';

function formatTimeslot(timeslot: ChannelTimeslot | null): string {
  return timeslot != null ? `TS${timeslot}` : '—';
}

function formatSlotSummary(
  slots: Array<{ number: string; timeslot: ChannelTimeslot | null }>,
): string {
  if (slots.length === 0) return '—';
  return slots.map((s) => `TG ${s.number} ${formatTimeslot(s.timeslot)}`).join(', ');
}

export function findBrandMeisterDeviceIdForRxList(
  rgl: RxGroupList,
  codeplug: Codeplug,
): number | null {
  const channel = codeplug.channels.find(
    (ch) =>
      ch.rxGroupListId === rgl.id &&
      ch.meta?.repeaterDirectory?.sourceId === 'brandmeister' &&
      ch.meta.repeaterDirectory.remoteListingId != null,
  );
  return channel?.meta?.repeaterDirectory?.remoteListingId ?? null;
}

export function diffRxGroupListFromBrandMeister(
  rgl: RxGroupList,
  staticTalkgroups: BrandMeisterStaticTalkgroup[],
  codeplug: Codeplug,
): EntityDiffRow[] {
  const remoteSlots = staticTalkgroupSlots(staticTalkgroups);
  const localByNumber = new Map<string, { timeslot: ChannelTimeslot | null }>();

  for (const member of rgl.memberRefs) {
    if (member.ref.kind !== 'talkGroup') continue;
    const tg = codeplug.talkGroups.find((t) => t.id === member.ref.id);
    const number = normalizeTalkGroupNumber(tg?.number ?? '');
    if (!number) continue;
    localByNumber.set(number, { timeslot: member.timeslot ?? null });
  }

  const rows: EntityDiffRow[] = [];
  const remoteNumbers = new Set<string>();

  for (const { number, timeslot } of remoteSlots) {
    remoteNumbers.add(number);
    const local = localByNumber.get(number);
    if (!local) {
      rows.push({
        field: `tg-${number}-missing`,
        label: `TG ${number}`,
        local: '—',
        remote: formatTimeslot(timeslot),
        changed: true,
      });
      continue;
    }

    if ((local.timeslot ?? null) !== (timeslot ?? null)) {
      rows.push({
        field: `tg-${number}-timeslot`,
        label: `TG ${number} timeslot`,
        local: formatTimeslot(local.timeslot),
        remote: formatTimeslot(timeslot),
        changed: true,
      });
    }
  }

  for (const [number, local] of localByNumber) {
    if (!remoteNumbers.has(number)) {
      rows.push({
        field: `tg-${number}-extra`,
        label: `TG ${number}`,
        local: formatTimeslot(local.timeslot),
        remote: '—',
        changed: true,
      });
    }
  }

  if (rows.length === 0) {
    return [
      {
        field: 'members',
        label: 'Static talk groups',
        local: formatSlotSummary(
          [...localByNumber.entries()].map(([number, { timeslot }]) => ({ number, timeslot })),
        ),
        remote: formatSlotSummary(remoteSlots),
        changed: false,
      },
    ];
  }

  return rows;
}
