import { describe, expect, it } from 'vitest';
import { parseChannels } from './parse.ts';
import { chirpMinimalBundle, chirpTsqlBundle } from '../../../test/chirp/bundles.ts';
import {
  deriveChirpDuplexAndOffset,
  deriveChirpTxFrequencyHz,
  parseChirpDuplex,
  parseChirpModeWire,
  parseChirpPowerWire,
  parseChirpTones,
} from './channelWire.ts';

const UV5R = 'baofeng-uv5r-mini';
const CHIRP_CTX = { profileId: UV5R };

describe('parseChirpChannels', () => {
  it('parses simplex and split channels from minimal bundle', () => {
    const channels = parseChannels(chirpMinimalBundle['chirp-minimal.csv']!, CHIRP_CTX);
    expect(channels).toHaveLength(2);

    const simplex = channels.find((c) => c.name === 'UK Call VHF');
    expect(simplex?.rxFrequency).toBe(145_500_000);
    expect(simplex?.txFrequency).toBe(145_500_000);
    expect(simplex?.mode).toBe('fm');
    expect(simplex?.bandwidthKHz).toBe(12.5);
    expect(simplex?.power).toBe(100);

    const split = channels.find((c) => c.name === "GB3CS M'well");
    expect(split?.rxFrequency).toBe(145_750_000);
    expect(split?.txFrequency).toBe(145_150_000);
    expect(split?.comment).toBe('GB3CS near Motherwell');
  });

  it('parses TSQL tones and profile power', () => {
    const channels = parseChannels(chirpTsqlBundle['chirp-tsql.csv']!, CHIRP_CTX);
    expect(channels[0]?.rxTone).toBe('103.5');
    expect(channels[0]?.txTone).toBe('103.5');
    expect(channels[0]?.power).toBe(20);
  });

  it('requires profileId', () => {
    expect(() => parseChannels(chirpMinimalBundle['chirp-minimal.csv']!)).toThrow(
      'CHIRP import requires a radio profile',
    );
  });
});

describe('chirp channelWire', () => {
  it('maps mode and duplex', () => {
    expect(parseChirpModeWire('NFM')).toEqual({ mode: 'fm', bandwidthKHz: 12.5 });
    expect(parseChirpModeWire('FM')).toEqual({ mode: 'fm', bandwidthKHz: 25 });
    expect(parseChirpModeWire('AM')).toEqual({ mode: 'am', bandwidthKHz: null });
    expect(deriveChirpTxFrequencyHz(430_900_000, '+', 7.6)).toBe(438_500_000);
    expect(parseChirpDuplex('off', 145_500_000, 0)).toEqual({
      txFrequency: 145_500_000,
      forbidTransmit: true,
    });
    expect(deriveChirpDuplexAndOffset(145_500_000, 145_500_000, true)).toEqual({
      duplex: 'off',
      offsetMhz: 0,
    });
  });

  it('parses power wire via profile ladder', () => {
    expect(parseChirpPowerWire('1.0W', UV5R)).toBe(20);
    expect(parseChirpPowerWire('5.0W', UV5R)).toBe(100);
  });

  it('parses tone modes', () => {
    expect(parseChirpTones('', '88.5', '88.5')).toEqual({ rxTone: 'none', txTone: 'none' });
    expect(parseChirpTones('Tone', '103.5', '88.5')).toEqual({
      rxTone: 'none',
      txTone: '103.5',
    });
    expect(parseChirpTones('TSQL', '88.5', '103.5')).toEqual({
      rxTone: '103.5',
      txTone: '103.5',
    });
  });
});
