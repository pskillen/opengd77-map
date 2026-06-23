import { describe, expect, it } from 'vitest';
import type { Channel } from '../models/codeplug.ts';
import {
  channelsForZone,
  channelsReferencingTalkGroupId,
  channelsWithContactRef,
  channelsWithRxGroupListId,
  findEntityById,
  formatReferenceCount,
  resolveRxGroupListMembers,
  rxGroupListsContainingMemberRef,
  sortByName,
  zonesContainingChannel,
} from './reportLookup.ts';
import {
  buildChannel,
  buildContact,
  buildImportedRxGroupList,
  buildRxGroupList,
  buildTalkGroup,
  buildZone,
} from '../test/builders/index.ts';

const channel = (id: string, name: string, extras: Partial<Channel> = {}): Channel =>
  buildChannel({ id, name, ...extras });

describe('reportLookup', () => {
  it('findEntityById returns entity or null', () => {
    const zones = [buildZone({ id: 'z1', name: 'Home' })];
    expect(findEntityById(zones, 'z1')?.name).toBe('Home');
    expect(findEntityById(zones, 'missing')).toBeNull();
  });

  it('zonesContainingChannel filters by memberChannelIds', () => {
    const zones = [
      buildZone({ id: 'z1', name: 'A', memberChannelIds: ['c1'] }),
      buildZone({ id: 'z2', name: 'B', memberChannelIds: ['c2'] }),
    ];
    expect(zonesContainingChannel('c1', zones).map((z) => z.name)).toEqual(['A']);
  });

  it('channelsWithContactRef matches by id', () => {
    const channels = [
      channel('c1', 'GB3SG', { contactRef: { kind: 'talkGroup', id: 'tg1' } }),
      channel('c2', 'GB3BF', { contactRef: { kind: 'talkGroup', id: 'tg2' } }),
    ];
    expect(channelsWithContactRef({ kind: 'talkGroup', id: 'tg1' }, channels)).toHaveLength(1);
    expect(channelsReferencingTalkGroupId('tg1', channels)).toHaveLength(1);
  });

  it('channelsWithRxGroupListId matches RX group list id', () => {
    const channels = [channel('c1', 'GB3SG', { rxGroupListId: 'rgl-1' })];
    expect(channelsWithRxGroupListId('rgl-1', channels)).toHaveLength(1);
    expect(channelsWithRxGroupListId('', channels)).toHaveLength(0);
  });

  it('channelsForZone preserves member order', () => {
    const zone = buildZone({
      id: 'z1',
      name: 'Scan',
      memberChannelIds: ['c2', 'c1'],
    });
    const channels = [channel('c1', 'A'), channel('c2', 'B')];
    expect(channelsForZone(zone, channels).map((c) => c.id)).toEqual(['c2', 'c1']);
  });

  it('resolveRxGroupListMembers walks memberRefs by id', () => {
    const rgl = buildRxGroupList({
      id: 'r1',
      name: 'Scotland',
      memberRefs: [
        { kind: 'talkGroup', id: 'tg1' },
        { kind: 'contact', id: 'ct1' },
        { kind: 'talkGroup', id: 'missing' },
      ],
    });
    const talkGroups = [buildTalkGroup({ id: 'tg1', name: 'Scotland', number: '950' })];
    const contacts = [buildContact({ id: 'ct1', name: 'MM9PDY', identifier: '123' })];
    const resolved = resolveRxGroupListMembers(rgl, talkGroups, contacts);
    expect(resolved.map((m) => m.kind)).toEqual(['talkGroup', 'contact', 'unresolved']);
  });

  it('resolveRxGroupListMembers falls back to provenance wire names', () => {
    const rgl = buildImportedRxGroupList({ id: 'r1', name: 'Scotland' }, [
      'Scotland',
      'MM9PDY',
      'Missing',
    ]);
    const talkGroups = [buildTalkGroup({ id: 'tg1', name: 'Scotland', number: '950' })];
    const contacts = [buildContact({ id: 'ct1', name: 'MM9PDY', identifier: '123' })];
    const resolved = resolveRxGroupListMembers(rgl, talkGroups, contacts);
    expect(resolved.map((m) => m.kind)).toEqual(['talkGroup', 'contact', 'unresolved']);
  });

  it('sortByName sorts locale-aware', () => {
    const items = [{ name: 'Zulu' }, { name: 'Alpha' }];
    expect(sortByName(items).map((i) => i.name)).toEqual(['Alpha', 'Zulu']);
  });

  it('rxGroupListsContainingMemberRef finds lists with member ref', () => {
    const lists = [
      buildRxGroupList({
        id: 'r1',
        name: 'A',
        memberRefs: [{ kind: 'talkGroup', id: 'tg1' }],
      }),
      buildRxGroupList({
        id: 'r2',
        name: 'B',
        memberRefs: [{ kind: 'contact', id: 'ct1' }],
      }),
      buildRxGroupList({
        id: 'r3',
        name: 'C',
        memberRefs: [
          { kind: 'talkGroup', id: 'tg1' },
          { kind: 'contact', id: 'ct1' },
        ],
      }),
    ];
    expect(
      rxGroupListsContainingMemberRef({ kind: 'talkGroup', id: 'tg1' }, lists).map((r) => r.name),
    ).toEqual(['A', 'C']);
  });

  it('formatReferenceCount renders empty for zero', () => {
    expect(formatReferenceCount(0)).toBe('');
    expect(formatReferenceCount(3)).toBe('3');
  });
});
