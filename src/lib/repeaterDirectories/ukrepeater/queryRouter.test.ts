import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EtccListing } from './types.ts';

vi.mock('./client.ts', () => ({
  fetchByCallsign: vi.fn(),
  fetchByKeeper: vi.fn(),
  fetchByLocator: vi.fn(),
  fetchByBand: vi.fn(),
}));

vi.mock('../../geocode.ts', () => ({
  geocodeQuery: vi.fn(),
}));

import {
  detectQueryKind,
  filterListings,
  routeQuery,
  searchUkRepeaters,
  searchUkRepeatersAtCoords,
  shouldApplyTownSubstring,
  shouldApplyTownSubstringForAuto,
} from './queryRouter.ts';
import { fetchByBand, fetchByCallsign, fetchByKeeper, fetchByLocator } from './client.ts';
import { geocodeQuery } from '../../geocode.ts';

const sampleListing: EtccListing = {
  id: 1,
  repeater: 'GB3A',
  status: 'OPERATIONAL',
  modeCodes: ['A'],
  tx: 145000000,
  rx: 145600000,
  ctcss: 0,
  band: '2M',
  town: 'DERBY',
};

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

describe('shouldApplyTownSubstring', () => {
  it('applies for town mode', () => {
    expect(shouldApplyTownSubstring('Derby', 'town')).toBe(true);
  });

  it('does not apply for postcode mode', () => {
    expect(shouldApplyTownSubstring('DE1 1AA', 'postcode')).toBe(false);
  });

  it('applies in auto for plain town names only', () => {
    expect(shouldApplyTownSubstringForAuto('Derby')).toBe(true);
    expect(shouldApplyTownSubstringForAuto('DE1 1AA')).toBe(false);
    expect(shouldApplyTownSubstringForAuto('10 High Street')).toBe(false);
  });
});

describe('filterListings', () => {
  const listings: EtccListing[] = [
    sampleListing,
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

describe('routeQuery', () => {
  beforeEach(() => {
    vi.mocked(fetchByCallsign).mockResolvedValue([sampleListing]);
    vi.mocked(fetchByKeeper).mockResolvedValue([sampleListing]);
    vi.mocked(fetchByLocator).mockResolvedValue([
      sampleListing,
      { ...sampleListing, id: 2, town: 'NOTTINGHAM' },
    ]);
    vi.mocked(fetchByBand).mockResolvedValue([sampleListing]);
    vi.mocked(geocodeQuery).mockResolvedValue({
      lat: 52.92,
      lon: -1.48,
      label: 'Derby, United Kingdom',
      provider: 'photon',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('routes repeater callsign mode to fetchByCallsign', async () => {
    const result = await routeQuery('GB7DC', { mode: 'callsign' });
    expect(fetchByCallsign).toHaveBeenCalledWith('GB7DC');
    expect(result.kind).toBe('callsign');
  });

  it('routes keeper mode to fetchByKeeper', async () => {
    const result = await routeQuery('G7NPW', { mode: 'keeper' });
    expect(fetchByKeeper).toHaveBeenCalledWith('G7NPW');
    expect(result.kind).toBe('keeper');
  });

  it('routes locator mode with 6-char square', async () => {
    const result = await routeQuery('IO92PP', { mode: 'locator' });
    expect(fetchByLocator).toHaveBeenCalledWith('IO92PP');
    expect(result.kind).toBe('locator');
  });

  it('returns empty for invalid locator in locator mode', async () => {
    const result = await routeQuery('not-a-locator', { mode: 'locator' });
    expect(fetchByLocator).not.toHaveBeenCalled();
    expect(result.listings).toHaveLength(0);
  });

  it('records geocoder no-match in pipeline when geocode returns null', async () => {
    vi.mocked(geocodeQuery).mockResolvedValue(null);
    const result = await routeQuery('bt412an', { mode: 'auto' });
    expect(result.listings).toHaveLength(0);
    expect(result.resolvedLocation).toBeUndefined();
    expect(result.pipeline.some((s) => s.text.includes('no match for "bt412an"'))).toBe(true);
    expect(fetchByLocator).not.toHaveBeenCalled();
  });

  it('geocodes postcode mode and returns resolvedLocation with pipeline', async () => {
    const result = await routeQuery('DE1 1AA', { mode: 'postcode' });
    expect(geocodeQuery).toHaveBeenCalled();
    expect(fetchByLocator).toHaveBeenCalled();
    expect(result.kind).toBe('location');
    expect(result.resolvedLocation).toMatchObject({
      source: 'geocode',
      provider: 'photon',
      label: 'Derby, United Kingdom',
      locator: expect.any(String),
    });
    expect(result.pipeline.some((s) => s.text.includes('Photon'))).toBe(true);
    expect(result.pipeline.some((s) => s.text.includes('response:'))).toBe(true);
    expect(result.pipeline.some((s) => s.text.includes('/locator/'))).toBe(true);
  });
});

describe('searchUkRepeatersAtCoords', () => {
  beforeEach(() => {
    vi.mocked(fetchByLocator).mockResolvedValue([sampleListing]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('searches by browser coordinates', async () => {
    const result = await searchUkRepeatersAtCoords(52.92, -1.48, {}, { accuracyMeters: 12 });
    expect(fetchByLocator).toHaveBeenCalled();
    expect(result.resolvedLocation?.source).toBe('browser');
    expect(result.pipeline[0]?.text).toContain('Browser geolocation');
    expect(result.listings).toHaveLength(1);
  });
});

describe('searchUkRepeaters', () => {
  beforeEach(() => {
    vi.mocked(fetchByLocator).mockResolvedValue([
      sampleListing,
      { ...sampleListing, id: 2, repeater: 'GB3B', town: 'NOTTINGHAM' },
    ]);
    vi.mocked(geocodeQuery).mockResolvedValue({
      lat: 52.92,
      lon: -1.48,
      label: 'Derby, United Kingdom',
      provider: 'photon',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not town-filter postcode searches', async () => {
    const result = await searchUkRepeaters('DE1 1AA', {}, { mode: 'postcode' });
    expect(result.listings).toHaveLength(2);
  });

  it('town-filters town mode searches', async () => {
    const result = await searchUkRepeaters('Derby', {}, { mode: 'town' });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].town).toBe('DERBY');
  });
});
