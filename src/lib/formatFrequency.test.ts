import { describe, expect, it } from 'vitest';
import {
  formatBandRangeMhz,
  formatChannelRxTxListCell,
  formatFrequencyMhz,
  formatMhzNumber,
} from './formatFrequency.ts';

describe('formatFrequencyMhz', () => {
  it('shows three decimal places for kHz-aligned frequencies', () => {
    expect(formatFrequencyMhz('145.775')).toBe('145.775 MHz');
    expect(formatFrequencyMhz('433.612')).toBe('433.612 MHz');
  });

  it('preserves sub-kHz precision when not kHz-aligned', () => {
    expect(formatFrequencyMhz('10.150250')).toBe('10.150250 MHz');
  });

  it('handles empty input', () => {
    expect(formatFrequencyMhz('')).toBe('');
    expect(formatFrequencyMhz('  ')).toBe('');
  });
});

describe('formatMhzNumber', () => {
  it('shows three decimal places for kHz-aligned values', () => {
    expect(formatMhzNumber(145.775)).toBe('145.775');
    expect(formatMhzNumber(1240)).toBe('1240.000');
    expect(formatMhzNumber(10.15)).toBe('10.150');
  });

  it('preserves sub-kHz precision', () => {
    expect(formatMhzNumber(5.2585)).toBe('5.2585');
    expect(formatMhzNumber(0.1357)).toBe('0.1357');
  });
});

describe('formatBandRangeMhz', () => {
  it('formats min–max with MHz unit', () => {
    expect(formatBandRangeMhz(144, 146)).toBe('144.000 – 146.000 MHz');
    expect(formatBandRangeMhz(5.2585, 5.4065)).toBe('5.2585 – 5.4065 MHz');
  });
});

describe('formatChannelRxTxListCell', () => {
  const mhz = (n: number) => n * 1_000_000;

  it('shows one value when RX equals TX', () => {
    expect(formatChannelRxTxListCell(mhz(145.775), mhz(145.775))).toBe('145.775');
  });

  it('shows rx / tx when split', () => {
    expect(formatChannelRxTxListCell(mhz(145.775), mhz(145.175))).toBe('145.775 / 145.175');
  });

  it('shows em dash when both missing', () => {
    expect(formatChannelRxTxListCell(null, null)).toBe('—');
  });
});
