import { describe, expect, it } from 'vitest';
import { channelFieldDefaults } from '../../../models/codeplug.ts';
import { channelToChirpRow, type ChirpChannelWireOptions } from './channelWire.ts';

function testWireOptions(): ChirpChannelWireOptions {
  return {
    reserved: new Set<string>(),
    maxNameLength: 128,
    shortenNames: false,
  };
}

describe('export/chirp/channelWire', () => {
  it('exports simplex when rx equals tx and forbidTransmit is false', () => {
    const row = channelToChirpRow(
      {
        ...channelFieldDefaults(),
        id: 'ch-1',
        name: 'Simplex',
        callsign: '',
        mode: 'fm',
        rxFrequency: 145_500_000,
        txFrequency: 145_500_000,
        forbidTransmit: false,
      },
      1,
      'baofeng-uv5r-mini',
      testWireOptions(),
    );
    expect(row[3]).toBe('');
    expect(row[4]).toBe('0.000000');
  });

  it('exports off duplex when forbidTransmit is true', () => {
    const row = channelToChirpRow(
      {
        ...channelFieldDefaults(),
        id: 'ch-2',
        name: 'Listen only',
        callsign: '',
        mode: 'fm',
        rxFrequency: 145_500_000,
        txFrequency: 145_500_000,
        forbidTransmit: true,
      },
      2,
      'baofeng-uv5r-mini',
      testWireOptions(),
    );
    expect(row[3]).toBe('off');
    expect(row[4]).toBe('0.000000');
  });

  it('preserves a 10-character name when maxNameLength override exceeds profile limit', () => {
    const row = channelToChirpRow(
      {
        ...channelFieldDefaults(),
        id: 'ch-4',
        name: 'TenCharOne',
        callsign: '',
        exportNameMode: 'name_only',
        mode: 'fm',
        rxFrequency: 145_500_000,
        txFrequency: 145_500_000,
        forbidTransmit: false,
      },
      4,
      'baofeng-uv5r-mini',
      { reserved: new Set<string>(), maxNameLength: 12, shortenNames: true },
    );
    expect(row[1]).toBe('TenCharOne');
  });

  it('uses channel abbreviation for export wire name when enabled', () => {
    const row = channelToChirpRow(
      {
        ...channelFieldDefaults(),
        id: 'ch-3',
        name: 'Largs Scotland West',
        abbreviation: 'Largs',
        callsign: 'GB7AC',
        exportNameMode: 'callsign_name',
        mode: 'fm',
        rxFrequency: 145_500_000,
        txFrequency: 145_500_000,
        forbidTransmit: false,
      },
      3,
      'baofeng-uv5r-mini',
      { ...testWireOptions(), useChannelAbbreviation: true },
    );
    expect(row[1]).toBe('GB7AC Largs');
  });
});
