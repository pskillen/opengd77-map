import { describe, expect, it } from 'vitest';
import { formatDistanceM, haversineDistanceM } from './geoDistance.ts';

describe('haversineDistanceM', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceM(55.86, -4.25, 55.86, -4.25)).toBe(0);
  });

  it('computes known Glasgow–Edinburgh distance (~67 km)', () => {
    // Glasgow city centre ~ 55.8642, -4.2518
    // Edinburgh city centre ~ 55.9533, -3.1883
    const m = haversineDistanceM(55.8642, -4.2518, 55.9533, -3.1883);
    expect(m).toBeGreaterThan(64_000);
    expect(m).toBeLessThan(70_000);
  });
});

describe('formatDistanceM', () => {
  it('formats sub-kilometre distances in metres', () => {
    expect(formatDistanceM(0)).toBe('0 m');
    expect(formatDistanceM(850)).toBe('850 m');
    expect(formatDistanceM(999)).toBe('999 m');
  });

  it('formats kilometre distances with one decimal', () => {
    expect(formatDistanceM(1000)).toBe('1.0 km');
    expect(formatDistanceM(12_400)).toBe('12.4 km');
  });

  it('returns em dash for invalid input', () => {
    expect(formatDistanceM(Number.NaN)).toBe('—');
    expect(formatDistanceM(-1)).toBe('—');
  });
});
