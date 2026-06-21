import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addChannel,
  addRxGroupList,
  addTalkGroup,
  addZone,
  channelNamesForIds,
  deleteChannel,
  deleteContact,
  deleteRxGroupList,
  deleteTalkGroup,
  deleteZone,
  OPENGD77_MAX_ZONE_MEMBERS,
  setRxGroupListMembers,
  setZoneMembers,
  updateChannel,
  updateContact,
  updateRxGroupList,
  updateTalkGroup,
  updateZone,
} from './codeplugMutations.ts';
import {
  channelFieldDefaults,
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
} from '../models/codeplug.ts';
import { buildChannel } from '../test/builders/index.ts';
import type { Channel } from '../models/codeplug.ts';

function makeChannel(id: string, name: string, extras: Partial<Channel> = {}) {
  return buildChannel({ id, name, ...extras });
}

describe('codeplugMutations', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `gen-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it('addChannel assigns id and callsign', () => {
    const cp = emptyCodeplug();
    const next = addChannel(cp, {
      name: 'GB3DA DMR',
      mode: 'dmr',
      ...channelFieldDefaults(),
    });
    expect(next.channels).toHaveLength(1);
    expect(next.channels[0].id).toBe('gen-1');
    expect(next.channels[0].callsign).toBe('GB3DA');
  });

  it('updateChannel rename refreshes zone sourceMemberNames', () => {
    const ch = makeChannel('ch-1', 'Old Name');
    const cp = {
      ...emptyCodeplug(),
      channels: [ch],
      zones: [
        {
          id: 'z-1',
          name: 'Zone A',
          memberChannelIds: ['ch-1'],
          sourceMemberNames: ['Old Name'],
        },
      ],
    };

    const next = updateChannel(cp, 'ch-1', { name: 'New Name' });
    expect(next.channels[0].name).toBe('New Name');
    expect(next.zones[0].sourceMemberNames).toEqual(['New Name']);
    expect(next.zones[0].memberChannelIds).toEqual(['ch-1']);
  });

  it('deleteChannel removes id from zones', () => {
    const cp = {
      ...emptyCodeplug(),
      channels: [makeChannel('ch-1', 'A'), makeChannel('ch-2', 'B')],
      zones: [
        {
          id: 'z-1',
          name: 'Z',
          memberChannelIds: ['ch-1', 'ch-2'],
          sourceMemberNames: ['A', 'B'],
        },
      ],
    };

    const next = deleteChannel(cp, 'ch-1');
    expect(next.channels).toHaveLength(1);
    expect(next.zones[0].memberChannelIds).toEqual(['ch-2']);
    expect(next.zones[0].sourceMemberNames).toEqual(['B']);
  });

  it('setZoneMembers enforces 80 cap', () => {
    const cp = {
      ...emptyCodeplug(),
      channels: [makeChannel('ch-1', 'A')],
      zones: [{ id: 'z-1', name: 'Z', memberChannelIds: [], sourceMemberNames: [] }],
    };

    const ids = Array.from({ length: OPENGD77_MAX_ZONE_MEMBERS + 1 }, (_, i) => `ch-${i}`);
    expect(() => setZoneMembers(cp, 'z-1', ids)).toThrow(/80/);
  });

  it('setZoneMembers rejects unknown channel ids', () => {
    const cp = {
      ...emptyCodeplug(),
      channels: [makeChannel('ch-1', 'A')],
      zones: [{ id: 'z-1', name: 'Z', memberChannelIds: [], sourceMemberNames: [] }],
    };

    expect(() => setZoneMembers(cp, 'z-1', ['missing'])).toThrow(/Unknown channel/);
  });

  it('setZoneMembers preserves order and derives names', () => {
    const cp = {
      ...emptyCodeplug(),
      channels: [makeChannel('ch-1', 'A'), makeChannel('ch-2', 'B')],
      zones: [{ id: 'z-1', name: 'Z', memberChannelIds: [], sourceMemberNames: [] }],
    };

    const next = setZoneMembers(cp, 'z-1', ['ch-2', 'ch-1']);
    expect(next.zones[0].memberChannelIds).toEqual(['ch-2', 'ch-1']);
    expect(next.zones[0].sourceMemberNames).toEqual(['B', 'A']);
  });

  it('addZone and updateZone and deleteZone', () => {
    let cp = emptyCodeplug();
    cp = addZone(cp, { name: 'North' });
    expect(cp.zones).toHaveLength(1);
    expect(cp.zones[0].name).toBe('North');

    const zoneId = cp.zones[0].id;
    cp = updateZone(cp, zoneId, { name: 'South' });
    expect(cp.zones[0].name).toBe('South');

    cp = deleteZone(cp, zoneId);
    expect(cp.zones).toHaveLength(0);
  });

  it('channelNamesForIds skips missing', () => {
    const channels = [makeChannel('ch-1', 'A')];
    expect(channelNamesForIds(channels, ['ch-1', 'gone'])).toEqual(['A']);
  });

  describe('talk groups', () => {
    it('addTalkGroup assigns id', () => {
      const cp = addTalkGroup(emptyCodeplug(), {
        name: 'Scotland',
        number: '950',
        timeslotOverride: '',
      });
      expect(cp.talkGroups).toHaveLength(1);
      expect(cp.talkGroups[0].id).toBe('gen-1');
      expect(cp.talkGroups[0].name).toBe('Scotland');
    });

    it('updateTalkGroup rename propagates to channels and RGL members', () => {
      const cp = {
        ...emptyCodeplug(),
        talkGroups: [{ id: 'tg-1', name: 'Old TG', number: '9', timeslotOverride: '' }],
        channels: [makeChannel('ch-1', 'GB3DA', { contactName: 'Old TG' })],
        rxGroupLists: [{ id: 'rgl-1', name: 'List', sourceMemberNames: ['Old TG', 'Other'] }],
      };
      const next = updateTalkGroup(cp, 'tg-1', { name: 'New TG' });
      expect(next.talkGroups[0].name).toBe('New TG');
      expect(next.channels[0].contactName).toBe('New TG');
      expect(next.rxGroupLists[0].sourceMemberNames).toEqual(['New TG', 'Other']);
    });

    it('deleteTalkGroup clears channel refs and removes from RGL members', () => {
      const cp = {
        ...emptyCodeplug(),
        talkGroups: [{ id: 'tg-1', name: 'Scotland', number: '950', timeslotOverride: '' }],
        channels: [makeChannel('ch-1', 'GB3DA', { contactName: 'Scotland' })],
        rxGroupLists: [{ id: 'rgl-1', name: 'List', sourceMemberNames: ['Scotland'] }],
      };
      const next = deleteTalkGroup(cp, 'tg-1');
      expect(next.talkGroups).toHaveLength(0);
      expect(next.channels[0].contactName).toBe('');
      expect(next.rxGroupLists[0].sourceMemberNames).toEqual([]);
    });
  });

  describe('contacts', () => {
    it('updateContact rename propagates like talk group', () => {
      const cp = {
        ...emptyCodeplug(),
        contacts: [{ id: 'ct-1', name: 'Old', number: '123', timeslotOverride: '' }],
        channels: [makeChannel('ch-1', 'GB3DA', { contactName: 'Old' })],
      };
      const next = updateContact(cp, 'ct-1', { name: 'New' });
      expect(next.channels[0].contactName).toBe('New');
    });

    it('deleteContact clears references', () => {
      const cp = {
        ...emptyCodeplug(),
        contacts: [{ id: 'ct-1', name: 'MM9PDY', number: '123', timeslotOverride: '' }],
        channels: [makeChannel('ch-1', 'GB3DA', { contactName: 'MM9PDY' })],
        rxGroupLists: [{ id: 'rgl-1', name: 'List', sourceMemberNames: ['MM9PDY'] }],
      };
      const next = deleteContact(cp, 'ct-1');
      expect(next.contacts).toHaveLength(0);
      expect(next.channels[0].contactName).toBe('');
      expect(next.rxGroupLists[0].sourceMemberNames).toEqual([]);
    });
  });

  describe('rx group lists', () => {
    it('addRxGroupList and updateRxGroupList rename propagates to channels', () => {
      let cp = addRxGroupList(emptyCodeplug(), {
        name: 'Scotland',
        sourceMemberNames: ['TG1'],
      });
      const rglId = cp.rxGroupLists[0].id;
      cp = {
        ...cp,
        channels: [makeChannel('ch-1', 'GB3DA', { rxGroupListName: 'Scotland' })],
      };
      const next = updateRxGroupList(cp, rglId, { name: 'Scotland2' });
      expect(next.rxGroupLists[0].name).toBe('Scotland2');
      expect(next.channels[0].rxGroupListName).toBe('Scotland2');
    });

    it('deleteRxGroupList clears channel rxGroupListName', () => {
      const cp = {
        ...emptyCodeplug(),
        rxGroupLists: [{ id: 'rgl-1', name: 'Scotland', sourceMemberNames: [] }],
        channels: [makeChannel('ch-1', 'GB3DA', { rxGroupListName: 'Scotland' })],
      };
      const next = deleteRxGroupList(cp, 'rgl-1');
      expect(next.rxGroupLists).toHaveLength(0);
      expect(next.channels[0].rxGroupListName).toBe('');
    });

    it('setRxGroupListMembers accepts large lists and dedupes', () => {
      const members = Array.from({ length: 40 }, (_, i) => `TG${i}`);
      members.push('TG0');
      const cp = {
        ...emptyCodeplug(),
        rxGroupLists: [{ id: 'rgl-1', name: 'Big', sourceMemberNames: [] }],
      };
      const next = setRxGroupListMembers(cp, 'rgl-1', members);
      expect(next.rxGroupLists[0].sourceMemberNames).toHaveLength(40);
      expect(next.rxGroupLists[0].sourceMemberNames[0]).toBe('TG0');
    });
  });
});
