import { describe, expect, it } from 'vitest';
import {
  assignNewTalkGroupIds,
  normalizeTalkGroupNumber,
  resolveTalkGroupsFromStatic,
  staticTalkgroupSlots,
  talkGroupIdByNormalizedNumber,
} from './mapTalkGroups.ts';
import { buildRepeaterRxGroupListInput } from './mapRxGroupList.ts';
import { diffRxGroupListFromBrandMeister } from './rxListDiff.ts';

describe('normalizeTalkGroupNumber', () => {
  it('strips leading zeros from numeric IDs', () => {
    expect(normalizeTalkGroupNumber('09')).toBe('9');
    expect(normalizeTalkGroupNumber('2350')).toBe('2350');
  });
});

describe('mapTalkGroups', () => {
  it('reuses existing talk groups by DMR ID regardless of name', async () => {
    const result = await resolveTalkGroupsFromStatic(
      [{ talkgroup: '9', slot: '1', repeaterid: '1' }],
      [{ id: 'tg-existing', name: 'Local label', number: '9' }],
    );
    expect(result.newTalkGroups).toHaveLength(0);
    expect(result.idByNumber.get('9')).toBe('tg-existing');
  });

  it('matches local talk groups when wire number has leading zeros', async () => {
    const result = await resolveTalkGroupsFromStatic(
      [{ talkgroup: '9', slot: '1', repeaterid: '1' }],
      [{ id: 'tg-existing', name: 'Whatever', number: '09' }],
    );
    expect(result.newTalkGroups).toHaveLength(0);
    expect(result.idByNumber.get('9')).toBe('tg-existing');
  });

  it('creates inputs only when DMR ID is missing locally', async () => {
    const result = await resolveTalkGroupsFromStatic(
      [{ talkgroup: '2350', slot: '2', repeaterid: '1' }],
      [],
    );
    expect(result.newTalkGroups).toHaveLength(1);
    expect(result.newTalkGroups[0].number).toBe('2350');
    expect(result.newTalkGroups[0].name).toBe('TG 2350');
  });

  it('staticTalkgroupSlots parses slot numbers', () => {
    const slots = staticTalkgroupSlots([
      { talkgroup: '9', slot: '1', repeaterid: '1' },
      { talkgroup: '2350', slot: '2', repeaterid: '1' },
    ]);
    expect(slots).toEqual([
      { number: '9', timeslot: 1 },
      { number: '2350', timeslot: 2 },
    ]);
  });

  it('assignNewTalkGroupIds maps numbers to ids', () => {
    let n = 0;
    const map = assignNewTalkGroupIds([{ name: 'TG 9', number: '9' }], () => `new-${++n}`);
    expect(map.get('9')).toBe('new-1');
  });

  it('talkGroupIdByNormalizedNumber indexes by canonical ID', () => {
    const map = talkGroupIdByNormalizedNumber([
      { id: 'a', name: 'A', number: '09', callType: 'group' },
    ]);
    expect(map.get('9')).toBe('a');
  });
});

describe('mapRxGroupList', () => {
  it('builds RX list with timeslots', () => {
    const idByNumber = new Map([
      ['9', 'tg-9'],
      ['2350', 'tg-2350'],
    ]);
    const input = buildRepeaterRxGroupListInput(
      { id: 1, callsign: 'GB7HH' },
      [
        { talkgroup: '9', slot: '1', repeaterid: '1' },
        { talkgroup: '2350', slot: '2', repeaterid: '1' },
      ],
      idByNumber,
    );
    expect(input?.name).toBe('GB7HH RX');
    expect(input?.memberRefs).toHaveLength(2);
    expect(input?.memberRefs?.[0]).toEqual({
      ref: { kind: 'talkGroup', id: 'tg-9' },
      timeslot: 1,
    });
  });
});

describe('rxListDiff', () => {
  const codeplug = {
    meta: { schemaVersion: 1, importedAt: null, sourceFiles: [] },
    talkGroups: [{ id: 'tg-9', name: 'Old name', number: '9', callType: 'group' as const }],
    contacts: [],
    channels: [],
    zones: [],
    rxGroupLists: [],
  };

  it('does not flag a match when only the talk group name differs', () => {
    const rows = diffRxGroupListFromBrandMeister(
      {
        id: 'rgl-1',
        name: 'Test RX',
        memberRefs: [{ ref: { kind: 'talkGroup', id: 'tg-9' }, timeslot: 1 }],
      },
      [{ talkgroup: '9', slot: '1', repeaterid: '1' }],
      codeplug,
    );
    expect(rows.every((r) => !r.changed)).toBe(true);
  });

  it('flags timeslot mismatch for the same DMR ID', () => {
    const rows = diffRxGroupListFromBrandMeister(
      {
        id: 'rgl-1',
        name: 'Test RX',
        memberRefs: [{ ref: { kind: 'talkGroup', id: 'tg-9' }, timeslot: 2 }],
      },
      [{ talkgroup: '9', slot: '1', repeaterid: '1' }],
      codeplug,
    );
    expect(rows.some((r) => r.changed && r.field === 'tg-9-timeslot')).toBe(true);
  });
});
