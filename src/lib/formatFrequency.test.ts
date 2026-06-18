import { describe, expect, it } from 'vitest';
import { formatFrequencyMhz } from './formatFrequency.ts';

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
