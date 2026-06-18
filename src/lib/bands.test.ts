import { describe, expect, it } from 'vitest';
import {
  bandFromChannel,
  bandFromFrequencyMhz,
  bandsFromFrequencies,
  channelMatchesBandFilter,
  formatOffsetMhz,
  frequencyOffsetMhz,
} from './bands.ts';

describe('bands', () => {
  it('classifies 2m and 70cm', () => {
    expect(bandFromFrequencyMhz(145.775)?.id).toBe('2m');
    expect(bandFromFrequencyMhz(433.6125)?.id).toBe('70cm');
  });

  it('uses RX then TX', () => {
    expect(bandFromChannel('', '145.775')?.id).toBe('2m');
  });

  it('formats offset', () => {
    expect(frequencyOffsetMhz('145.775', '145.775')).toBe(0);
    expect(formatOffsetMhz(-0.6)).toBe('-0.6 MHz');
  });

  it('returns distinct RX and TX bands', () => {
    const bands = bandsFromFrequencies('145.775', '433.612');
    expect(bands.map((b) => b.id)).toEqual(['2m', '70cm']);
  });

  it('matches band filter on either RX or TX', () => {
    expect(channelMatchesBandFilter('145.775', '433.612', ['70cm'])).toBe(true);
    expect(channelMatchesBandFilter('145.775', '433.612', ['2m'])).toBe(true);
    expect(channelMatchesBandFilter('145.775', '433.612', ['6m'])).toBe(false);
  });
});
