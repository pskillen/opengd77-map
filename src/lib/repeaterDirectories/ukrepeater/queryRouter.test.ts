import { describe, expect, it } from 'vitest';
import { detectQueryKind, filterListings } from './queryRouter.ts';
import type { EtccListing } from './types.ts';

describe('detectQueryKind', () => {
  it('detects callsign', () => {
    expect(detectQueryKind('GB7DC')).toBe('callsign');
  });

  it('detects locator', () => {
    expect(detectQueryKind('IO92')).toBe('locator');
    expect(detectQueryKind('io92pp')).toBe('locator');
  });

  it('detects band', () => {
    expect(detectQueryKind('2m')).toBe('band');
    expect(detectQueryKind('70cm')).toBe('band');
  });

  it('defaults to location for free text', () => {
    expect(detectQueryKind('Derby')).toBe('location');
  });

  it('detects UK postcodes as location (geocode path), not callsign', () => {
    expect(detectQueryKind('DE1 1AA')).toBe('location');
    expect(detectQueryKind('SW1A 1AA')).toBe('location');
    expect(detectQueryKind('M1 1AE')).toBe('location');
  });
});

describe('filterListings', () => {
  const listings: EtccListing[] = [
    {
      id: 1,
      repeater: 'GB3A',
      status: 'OPERATIONAL',
      modeCodes: ['A'],
      tx: 145000000,
      rx: 145600000,
      ctcss: 0,
      band: '2M',
      town: 'DERBY',
    },
    {
      id: 2,
      repeater: 'GB3B',
      status: 'NOT OPERATIONAL',
      modeCodes: ['A'],
      tx: 145000000,
      rx: 145600000,
      ctcss: 0,
      band: '2M',
      town: 'NOTTINGHAM',
    },
  ];

  it('filters operational only', () => {
    expect(filterListings(listings, { operationalOnly: true })).toHaveLength(1);
  });

  it('filters by town substring', () => {
    expect(filterListings(listings, { townSubstring: 'derby' })).toHaveLength(1);
  });
});
