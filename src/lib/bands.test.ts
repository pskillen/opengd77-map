import { describe, expect, it } from 'vitest';
import {
  ALL_BANDS,
  bandFromChannel,
  bandFromFrequencyMhz,
  bandsFromFrequencies,
  channelMatchesBandFilter,
  formatOffsetMhz,
  frequencyOffsetMhz,
  SERVICE_BANDS,
  UK_AMATEUR_BANDS,
} from './bands.ts';

const mhzToHz = (mhz: number) => Math.round(mhz * 1_000_000);

describe('bands', () => {
  it('classifies 2m and 70cm', () => {
    expect(bandFromFrequencyMhz(145.775)?.id).toBe('2m');
    expect(bandFromFrequencyMhz(433.6125)?.id).toBe('70cm');
  });

  it('classifies non-amateur services', () => {
    expect(bandFromFrequencyMhz(446.05625)?.id).toBe('pmr446');
    expect(bandFromFrequencyMhz(121.5)?.id).toBe('airband');
    expect(bandFromFrequencyMhz(156.8)?.id).toBe('marine');
    expect(bandFromFrequencyMhz(95.0)?.id).toBe('fm-broadcast');
    expect(bandFromFrequencyMhz(0.198)?.id).toBe('broadcast-lw');
    expect(bandFromFrequencyMhz(0.9)?.id).toBe('broadcast-mw');
    expect(bandFromFrequencyMhz(3.0)?.id).toBe('broadcast-sw-1');
  });

  it('disambiguates amateur 136 kHz from broadcast LW', () => {
    expect(bandFromFrequencyMhz(0.136)?.id).toBe('136khz');
    expect(bandFromFrequencyMhz(0.198)?.id).toBe('broadcast-lw');
  });

  it('keeps amateur HF inside licence spans', () => {
    expect(bandFromFrequencyMhz(14.1)?.id).toBe('20m');
    expect(bandFromFrequencyMhz(7.05)?.id).toBe('40m');
    expect(bandFromFrequencyMhz(145.775)?.id).toBe('2m');
  });

  it('does not classify 2m repeater as marine', () => {
    expect(bandFromFrequencyMhz(145.775)?.id).not.toBe('marine');
    expect(bandFromFrequencyMhz(156.8)?.id).toBe('marine');
  });

  it('uses RX then TX', () => {
    expect(bandFromChannel(null, mhzToHz(145.775))?.id).toBe('2m');
  });

  it('formats offset', () => {
    const freq = mhzToHz(145.775);
    expect(frequencyOffsetMhz(freq, freq)).toBe(0);
    expect(formatOffsetMhz(-0.6)).toBe('-0.6 MHz');
  });

  it('returns distinct RX and TX bands', () => {
    const bands = bandsFromFrequencies(mhzToHz(145.775), mhzToHz(433.612));
    expect(bands.map((b) => b.id)).toEqual(['2m', '70cm']);
  });

  it('matches band filter on either RX or TX', () => {
    expect(channelMatchesBandFilter(mhzToHz(145.775), mhzToHz(433.612), ['70cm'])).toBe(true);
    expect(channelMatchesBandFilter(mhzToHz(145.775), mhzToHz(433.612), ['2m'])).toBe(true);
    expect(channelMatchesBandFilter(mhzToHz(145.775), mhzToHz(433.612), ['6m'])).toBe(false);
    expect(channelMatchesBandFilter(mhzToHz(446.05625), mhzToHz(446.05625), ['pmr446'])).toBe(true);
  });

  it('exposes notes for reference display', () => {
    expect(UK_AMATEUR_BANDS).toHaveLength(23);
    expect(UK_AMATEUR_BANDS.find((b) => b.id === '136khz')?.notes).toBe('Full only');
    expect(UK_AMATEUR_BANDS.find((b) => b.id === '160m')?.notes).toBeUndefined();
    expect(SERVICE_BANDS).toHaveLength(16);
    expect(ALL_BANDS.length).toBe(UK_AMATEUR_BANDS.length + SERVICE_BANDS.length);
  });

  it('orders ALL_BANDS by increasing frequency', () => {
    for (let i = 1; i < ALL_BANDS.length; i++) {
      expect(ALL_BANDS[i].minMhz).toBeGreaterThanOrEqual(ALL_BANDS[i - 1].minMhz);
    }
  });
});
