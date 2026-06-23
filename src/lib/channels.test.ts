import { describe, expect, it } from 'vitest';
import { buildGeolocatedChannel, buildImportedZone } from '../test/builders/index.ts';
import {
  applyFilters,
  buildChannelById,
  channelMatchesModeFilter,
  dominantMode,
  filterChannelsByDistance,
  groupByCoords,
  markerColor,
  markerLabel,
  zoneGeolocatedPoints,
} from './channels.ts';

const ch = buildGeolocatedChannel;

describe('markerColor', () => {
  it('returns per-mode colours from channelModes', () => {
    expect(markerColor('fm')).toBe('#f0c419');
    expect(markerColor('dmr')).toBe('#e03131');
    expect(markerColor('dstar')).toBe('#7950f2');
    expect(markerColor('other')).toBe('#9c36b5');
  });
});

describe('applyFilters', () => {
  const channels = [
    ch({ id: '1', name: 'A', location: null }),
    ch({ id: '2', name: 'B', location: { lat: 0, lon: 0 } }),
    ch({ id: '3', name: 'C', useLocation: false }),
    ch({ id: '4', name: 'D' }),
  ];

  it('skips missing coords, 0,0, and Use Location=No', () => {
    const { plotted, skipped } = applyFilters(channels, {
      requireUseLocation: true,
      skipZero: true,
    });
    expect(plotted).toHaveLength(1);
    expect(plotted[0].name).toBe('D');
    expect(skipped).toHaveLength(3);
    expect(skipped.map((s) => s.reason)).toContain('missing coordinates');
    expect(skipped.map((s) => s.reason)).toContain('0,0 coordinates');
    expect(skipped.map((s) => s.reason)).toContain('Use Location = No');
  });
});

describe('groupByCoords', () => {
  const list = [
    ch({ id: '1', name: 'A', location: { lat: 56.5, lon: -4.0 } }),
    ch({ id: '2', name: 'B', location: { lat: 56.5, lon: -4.0 } }),
    ch({ id: '3', name: 'C', location: { lat: 57.0, lon: -3.5 } }),
  ];

  it('merges co-located channels when merge is true', () => {
    expect(groupByCoords(list, true)).toHaveLength(2);
    expect(groupByCoords(list, true)[0]).toHaveLength(2);
  });

  it('returns one group per channel when merge is false', () => {
    expect(groupByCoords(list, false)).toHaveLength(3);
  });
});

describe('dominantMode', () => {
  it('returns the most frequent mode in a group', () => {
    const group = [ch({ id: '1', name: 'A', mode: 'dmr' }), ch({ id: '2', name: 'B', mode: 'fm' })];
    expect(dominantMode(group)).toBe('dmr');
  });

  it('returns fm when it is the majority', () => {
    const group = [
      ch({ id: '1', name: 'A', mode: 'dmr' }),
      ch({ id: '2', name: 'B', mode: 'fm' }),
      ch({ id: '3', name: 'C', mode: 'fm' }),
    ];
    expect(dominantMode(group)).toBe('fm');
  });
});

describe('markerLabel', () => {
  it('uses callsign by default and full name when requested', () => {
    const group = [ch({ id: '1', name: 'DMR', callsign: 'GB3DA' })];
    expect(markerLabel(group, false)).toBe('GB3DA');
    expect(markerLabel(group, true)).toBe('GB3DA — DMR');
  });

  it('appends +N for merged groups', () => {
    const group = [
      ch({ id: '1', name: 'DMR', callsign: 'GB3DA' }),
      ch({ id: '2', name: 'FM', callsign: 'GB3DA' }),
    ];
    expect(markerLabel(group, false)).toBe('GB3DA +1');
  });

  it('shows combined mode summary for multi-mode channel', () => {
    const group = [
      ch({
        id: '1',
        name: 'Glasgow',
        callsign: 'GB7GL',
        mode: 'fm',
        multiMode: true,
        modeProfiles: [
          {
            mode: 'fm',
            bandwidthKHz: null,
            colourCode: null,
            timeslot: null,
            dmrId: null,
            rxTone: 'none',
            txTone: 'none',
            squelch: null,
            contactRef: null,
            rxGroupListId: null,
          },
          {
            mode: 'dmr',
            bandwidthKHz: null,
            colourCode: null,
            timeslot: null,
            dmrId: null,
            rxTone: 'none',
            txTone: 'none',
            squelch: null,
            contactRef: null,
            rxGroupListId: null,
          },
        ],
      }),
    ];
    expect(markerLabel(group, false)).toBe('GB7GL FM+DMR');
  });
});

describe('zoneGeolocatedPoints', () => {
  const allChannels = [
    ch({ id: 'id-a', name: 'A', location: { lat: 56.5, lon: -4.0 } }),
    ch({ id: 'id-b', name: 'B', location: { lat: 56.5, lon: -4.0 } }),
  ];
  const zone = buildImportedZone(
    {
      id: 'z1',
      name: 'North',
      memberChannelIds: ['id-a', 'id-b'],
    },
    ['A', 'B', 'Missing'],
  );
  const plottedById = buildChannelById(allChannels);

  it('resolves plotted members and reports missing', () => {
    const { points, missing } = zoneGeolocatedPoints(zone, plottedById, allChannels, {
      requireUseLocation: true,
      skipZero: true,
    });
    expect(points).toHaveLength(1);
    expect(missing.some((m) => m.reason === 'unresolved member')).toBe(true);
  });
});

describe('channelMatchesModeFilter', () => {
  it('matches primary mode on single-mode channels', () => {
    const channel = ch({ id: '1', name: 'A', mode: 'dmr' });
    expect(channelMatchesModeFilter(channel, ['dmr'])).toBe(true);
    expect(channelMatchesModeFilter(channel, ['fm'])).toBe(false);
  });

  it('matches any profile mode on multi-mode channels', () => {
    const multi = ch({
      id: '1',
      name: 'GB7GL',
      mode: 'fm',
      multiMode: true,
      modeProfiles: [
        {
          mode: 'fm',
          bandwidthKHz: null,
          colourCode: null,
          timeslot: null,
          dmrId: null,
          rxTone: 'none',
          txTone: 'none',
          squelch: null,
          contactRef: null,
          rxGroupListId: null,
        },
        {
          mode: 'dmr',
          bandwidthKHz: null,
          colourCode: null,
          timeslot: null,
          dmrId: null,
          rxTone: 'none',
          txTone: 'none',
          squelch: null,
          contactRef: null,
          rxGroupListId: null,
        },
      ],
    });
    expect(channelMatchesModeFilter(multi, ['dmr'])).toBe(true);
    expect(channelMatchesModeFilter(multi, ['fm'])).toBe(true);
    expect(channelMatchesModeFilter(multi, ['ysf'])).toBe(false);
  });

  it('passes when filter is empty', () => {
    expect(channelMatchesModeFilter(ch({ id: '1', name: 'A', mode: 'dmr' }), [])).toBe(true);
  });
});

describe('filterChannelsByDistance', () => {
  const operator = { lat: 55.8642, lon: -4.2518 };
  const near = ch({
    id: 'near',
    name: 'Near',
    location: { lat: 55.87, lon: -4.26 },
    useLocation: true,
  });
  const far = ch({
    id: 'far',
    name: 'Far',
    location: { lat: 55.9533, lon: -3.1883 },
    useLocation: true,
  });
  const noLoc = ch({ id: 'noloc', name: 'NoLoc', location: null, useLocation: false });

  it('returns all channels when disabled', () => {
    expect(
      filterChannelsByDistance([near, far, noLoc], {
        enabled: false,
        operatorPosition: operator,
        maxDistanceKm: 10,
      }),
    ).toHaveLength(3);
  });

  it('drops channels without geolocation when enabled', () => {
    expect(
      filterChannelsByDistance([near, noLoc], {
        enabled: true,
        operatorPosition: null,
        maxDistanceKm: 50,
      }),
    ).toEqual([near]);
  });

  it('filters by max distance when operator position is set', () => {
    const result = filterChannelsByDistance([near, far], {
      enabled: true,
      operatorPosition: operator,
      maxDistanceKm: 10,
    });
    expect(result.map((c) => c.id)).toEqual(['near']);
  });
});
