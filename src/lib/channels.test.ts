import { describe, expect, it } from 'vitest';
import type { Channel } from './csv.ts';
import {
  applyFilters,
  buildChannelIndex,
  dominantType,
  groupByCoords,
  markerColor,
  markerLabel,
  zoneGeolocatedPoints,
} from './channels.ts';
import type { Zone } from './csv.ts';

function ch(overrides: Partial<Channel> & Pick<Channel, 'name'>): Channel {
  return {
    number: '1',
    callsign: overrides.name.split(/\s+/)[0],
    type: 'Digital',
    rx: '',
    tx: '',
    contact: '',
    tgList: '',
    lat: 56.5,
    lon: -4.0,
    useLocation: true,
    ...overrides,
  };
}

describe('markerColor', () => {
  it('maps analogue and digital types', () => {
    expect(markerColor('Analogue')).toBe('#f0c419');
    expect(markerColor('analog')).toBe('#f0c419');
    expect(markerColor('Digital')).toBe('#e03131');
    expect(markerColor('Unknown')).toBe('#9c36b5');
  });
});

describe('applyFilters', () => {
  const channels = [
    ch({ name: 'A', lat: null, lon: null }),
    ch({ name: 'B', lat: 0, lon: 0 }),
    ch({ name: 'C', useLocation: false }),
    ch({ name: 'D' }),
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
    ch({ name: 'A', lat: 56.5, lon: -4.0 }),
    ch({ name: 'B', lat: 56.5, lon: -4.0 }),
    ch({ name: 'C', lat: 57.0, lon: -3.5 }),
  ];

  it('merges co-located channels when merge is true', () => {
    expect(groupByCoords(list, true)).toHaveLength(2);
    expect(groupByCoords(list, true)[0]).toHaveLength(2);
  });

  it('returns one group per channel when merge is false', () => {
    expect(groupByCoords(list, false)).toHaveLength(3);
  });
});

describe('dominantType', () => {
  it('returns Digital when majority are digital', () => {
    const group = [ch({ name: 'A', type: 'Digital' }), ch({ name: 'B', type: 'Analogue' })];
    expect(dominantType(group)).toBe('Digital');
  });

  it('returns Analogue when digital is minority', () => {
    const group = [
      ch({ name: 'A', type: 'Digital' }),
      ch({ name: 'B', type: 'Analogue' }),
      ch({ name: 'C', type: 'Analogue' }),
    ];
    expect(dominantType(group)).toBe('Analogue');
  });
});

describe('markerLabel', () => {
  it('uses callsign by default and full name when requested', () => {
    const group = [ch({ name: 'GB3DA DMR' })];
    expect(markerLabel(group, false)).toBe('GB3DA');
    expect(markerLabel(group, true)).toBe('GB3DA DMR');
  });

  it('appends +N for merged groups', () => {
    const group = [ch({ name: 'GB3DA DMR' }), ch({ name: 'GB3DA FM' })];
    expect(markerLabel(group, false)).toBe('GB3DA +1');
  });
});

describe('zoneGeolocatedPoints', () => {
  const zone: Zone = { name: 'North', members: ['A', 'B', 'Missing'] };
  const index = buildChannelIndex([
    ch({ name: 'A', lat: 56.5, lon: -4.0 }),
    ch({ name: 'B', lat: 56.5, lon: -4.0 }),
  ]);

  it('resolves plotted members and reports missing', () => {
    const { points, missing } = zoneGeolocatedPoints(zone, index, {
      requireUseLocation: true,
      skipZero: true,
    });
    expect(points).toHaveLength(1);
    expect(missing).toHaveLength(1);
    expect(missing[0].reason).toBe('not in Channels.csv');
  });
});
