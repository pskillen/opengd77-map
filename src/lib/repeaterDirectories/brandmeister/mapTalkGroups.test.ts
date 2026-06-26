import { describe, expect, it, vi } from 'vitest';
import {
  assignNewTalkGroupIds,
  resolveTalkGroupsFromStatic,
  staticTalkgroupSlots,
} from './mapTalkGroups.ts';
import { buildRepeaterRxGroupListInput } from './mapRxGroupList.ts';

vi.mock('./client.ts', () => ({
  fetchTalkgroupMeta: vi.fn(async (id: string) => ({ ID: Number(id), Name: 'Local' })),
}));

describe('mapTalkGroups', () => {
  it('dedupes against existing talk groups by number', async () => {
    const result = await resolveTalkGroupsFromStatic(
      [{ talkgroup: '9', slot: '1', repeaterid: '1' }],
      [{ id: 'tg-existing', name: 'Local', number: '9' }],
    );
    expect(result.newTalkGroups).toHaveLength(0);
    expect(result.idByNumber.get('9')).toBe('tg-existing');
  });

  it('creates inputs for missing talk groups', async () => {
    const result = await resolveTalkGroupsFromStatic(
      [{ talkgroup: '2350', slot: '2', repeaterid: '1' }],
      [],
    );
    expect(result.newTalkGroups).toHaveLength(1);
    expect(result.newTalkGroups[0].number).toBe('2350');
    expect(result.newTalkGroups[0].name).toBe('Local');
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
    const map = assignNewTalkGroupIds(
      [{ name: 'TG 9', number: '9' }],
      () => `new-${++n}`,
    );
    expect(map.get('9')).toBe('new-1');
  });
});

describe('mapRxGroupList', () => {
  it('builds RX list with timeslots', () => {
    const idByNumber = new Map([['9', 'tg-9'], ['2350', 'tg-2350']]);
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
    expect(input?.memberRefs[0]).toEqual({
      ref: { kind: 'talkGroup', id: 'tg-9' },
      timeslot: 1,
    });
  });
});
