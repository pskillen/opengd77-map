import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addChannel,
  addZone,
  channelNamesForIds,
  deleteChannel,
  deleteZone,
  OPENGD77_MAX_ZONE_MEMBERS,
  setZoneMembers,
  updateChannel,
  updateZone,
} from './codeplugMutations.ts';
import {
  channelFieldDefaults,
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
} from '../models/codeplug.ts';

function makeChannel(id: string, name: string) {
  return {
    id,
    name,
    callsign: name.split(' ')[0],
    mode: 'digital' as const,
    ...channelFieldDefaults(),
    number: '1',
  };
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
      mode: 'digital',
      ...channelFieldDefaults(),
      number: '',
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
});
