import { describe, expect, it } from 'vitest';
import type { Channel, Contact, RxGroupList, TalkGroup, Zone } from '../models/codeplug.ts';
import {
  channelsForZone,
  channelsWithContactName,
  channelsWithRxGroupList,
  channelsWithTalkGroupName,
  findEntityById,
  resolveRxGroupListMembers,
  sortByName,
  zonesContainingChannel,
} from './reportLookup.ts';

const channel = (id: string, name: string, extras: Partial<Channel> = {}): Channel =>
  ({
    id,
    name,
    callsign: name.split(' ')[0],
    mode: 'digital',
    contactName: '',
    rxGroupListName: '',
    location: null,
    useLocation: false,
    rxFrequency: '',
    txFrequency: '',
    number: '',
    bandwidthKHz: '',
    colourCode: '',
    timeslot: '',
    dmrId: '',
    rxTone: '',
    txTone: '',
    squelch: '',
    power: '',
    rxOnly: '',
    aprsConfigName: '',
    voxEnabled: false,
    transmitTimeout: '',
    scanSkip: false,
    vendorExtras: {},
    ...extras,
  }) as Channel;

describe('reportLookup', () => {
  it('findEntityById returns entity or null', () => {
    const zones: Zone[] = [{ id: 'z1', name: 'Home', memberChannelIds: [], sourceMemberNames: [] }];
    expect(findEntityById(zones, 'z1')?.name).toBe('Home');
    expect(findEntityById(zones, 'missing')).toBeNull();
  });

  it('zonesContainingChannel filters by memberChannelIds', () => {
    const zones: Zone[] = [
      { id: 'z1', name: 'A', memberChannelIds: ['c1'], sourceMemberNames: [] },
      { id: 'z2', name: 'B', memberChannelIds: ['c2'], sourceMemberNames: [] },
    ];
    expect(zonesContainingChannel('c1', zones).map((z) => z.name)).toEqual(['A']);
  });

  it('channelsWithContactName matches case-sensitively', () => {
    const channels = [
      channel('c1', 'GB3SG', { contactName: 'Scotland' }),
      channel('c2', 'GB3BF', { contactName: 'scotland' }),
    ];
    expect(channelsWithContactName('Scotland', channels)).toHaveLength(1);
    expect(channelsWithTalkGroupName('Scotland', channels)).toHaveLength(1);
  });

  it('channelsWithRxGroupList matches RX group list name', () => {
    const channels = [channel('c1', 'GB3SG', { rxGroupListName: 'Scotland' })];
    expect(channelsWithRxGroupList('Scotland', channels)).toHaveLength(1);
    expect(channelsWithRxGroupList('None', channels)).toHaveLength(0);
  });

  it('channelsForZone preserves member order', () => {
    const zone: Zone = {
      id: 'z1',
      name: 'Scan',
      memberChannelIds: ['c2', 'c1'],
      sourceMemberNames: [],
    };
    const channels = [channel('c1', 'A'), channel('c2', 'B')];
    expect(channelsForZone(zone, channels).map((c) => c.id)).toEqual(['c2', 'c1']);
  });

  it('resolveRxGroupListMembers splits talk groups, contacts, unresolved', () => {
    const rgl: RxGroupList = {
      id: 'r1',
      name: 'Scotland',
      sourceMemberNames: ['Scotland', 'MM9PDY', 'Missing'],
    };
    const talkGroups: TalkGroup[] = [
      { id: 'tg1', name: 'Scotland', number: '950', timeslotOverride: '' },
    ];
    const contacts: Contact[] = [
      { id: 'ct1', name: 'MM9PDY', number: '123', timeslotOverride: '' },
    ];
    const resolved = resolveRxGroupListMembers(rgl, talkGroups, contacts);
    expect(resolved.map((m) => m.kind)).toEqual(['talkGroup', 'contact', 'unresolved']);
  });

  it('sortByName sorts locale-aware', () => {
    const items = [{ name: 'Zulu' }, { name: 'Alpha' }];
    expect(sortByName(items).map((i) => i.name)).toEqual(['Alpha', 'Zulu']);
  });
});
