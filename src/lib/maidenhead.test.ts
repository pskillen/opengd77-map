import { describe, expect, it } from 'vitest';
import { coordsToLocator, isValidLocator, locatorToCoords } from './maidenhead.ts';

describe('maidenhead', () => {
  it('validates locators', () => {
    expect(isValidLocator('IO85')).toBe(true);
    expect(isValidLocator('io85')).toBe(true);
    expect(isValidLocator('IO8')).toBe(false);
  });

  it('round-trips at 6 chars', () => {
    const lat = 55.86;
    const lon = -4.25;
    const loc = coordsToLocator(lat, lon, 6);
    const coords = locatorToCoords(loc);
    expect(coords).not.toBeNull();
    if (coords) {
      expect(coords.lat).toBeCloseTo(lat, 0);
      expect(coords.lon).toBeCloseTo(lon, 0);
    }
  });

  it('parses IO85uk', () => {
    const coords = locatorToCoords('IO85uk');
    expect(coords).not.toBeNull();
  });
});
