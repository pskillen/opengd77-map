import { describe, expect, it } from 'vitest';
import { channelFieldDefaults } from '../../../models/codeplug.ts';
import { channelToChirpRow } from './channelWire.ts';

describe('export/chirp/channelWire', () => {
  it('exports simplex when rx equals tx and rxOnly is false', () => {
    const row = channelToChirpRow(
      {
        ...channelFieldDefaults(),
        id: 'ch-1',
        name: 'Simplex',
        callsign: '',
        mode: 'fm',
        rxFrequency: 145_500_000,
        txFrequency: 145_500_000,
        rxOnly: false,
      },
      1,
      'baofeng-uv5r-mini',
    );
    expect(row[3]).toBe('');
    expect(row[4]).toBe('0.000000');
  });

  it('exports off duplex when rxOnly is true', () => {
    const row = channelToChirpRow(
      {
        ...channelFieldDefaults(),
        id: 'ch-2',
        name: 'Listen only',
        callsign: '',
        mode: 'fm',
        rxFrequency: 145_500_000,
        txFrequency: 145_500_000,
        rxOnly: true,
      },
      2,
      'baofeng-uv5r-mini',
    );
    expect(row[3]).toBe('off');
    expect(row[4]).toBe('0.000000');
  });
});
