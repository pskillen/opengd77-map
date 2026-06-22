import { describe, expect, it } from 'vitest';
import { parseChannels } from './parse.ts';
import { chirpMinimalBundle, chirpTsqlBundle } from '../../../test/chirp/bundles.ts';
import {
  deriveChirpTxFrequencyHz,
  parseChirpModeWire,
  parseChirpPowerWire,
  parseChirpTones,
} from './channelWire.ts';

describe('parseChirpChannels', () => {
  it('parses simplex and split channels from minimal bundle', () => {
    const channels = parseChannels(chirpMinimalBundle['chirp-minimal.csv']!);
    expect(channels).toHaveLength(2);

    const simplex = channels.find((c) => c.name === 'UK Call VHF');
    expect(simplex?.rxFrequency).toBe(145_500_000);
    expect(simplex?.txFrequency).toBe(145_500_000);
    expect(simplex?.mode).toBe('fm');

    const split = channels.find((c) => c.name === "GB3CS M'well");
    expect(split?.rxFrequency).toBe(145_750_000);
    expect(split?.txFrequency).toBe(145_150_000);
  });

  it('parses TSQL tones', () => {
    const channels = parseChannels(chirpTsqlBundle['chirp-tsql.csv']!);
    expect(channels[0]?.rxTone).toBe('88.5');
    expect(channels[0]?.txTone).toBe('103.5');
    expect(channels[0]?.power).toBe(25);
  });
});

describe('chirp channelWire', () => {
  it('maps mode and duplex', () => {
    expect(parseChirpModeWire('NFM')).toBe('fm');
    expect(parseChirpModeWire('AM')).toBe('am');
    expect(deriveChirpTxFrequencyHz(430_900_000, '+', 7.6)).toBe(438_500_000);
  });

  it('parses power wire', () => {
    expect(parseChirpPowerWire('1.0W')).toBe(25);
    expect(parseChirpPowerWire('5.0W')).toBeNull();
  });

  it('parses tone modes', () => {
    expect(parseChirpTones('', '88.5', '88.5')).toEqual({ rxTone: 'none', txTone: 'none' });
    expect(parseChirpTones('Tone', '103.5', '88.5')).toEqual({
      rxTone: 'none',
      txTone: '88.5',
    });
  });
});
