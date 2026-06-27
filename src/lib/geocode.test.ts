import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeocodeError, geocodeQuery } from './geocode.ts';

describe('geocodeQuery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses Photon when provider is photon', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [-4.25, 55.86] },
            properties: { name: 'Glasgow', city: 'Glasgow', country: 'United Kingdom' },
          },
        ],
      }),
    } as Response);

    const result = await geocodeQuery('Glasgow', { provider: 'photon' });

    expect(result).toEqual({
      lat: 55.86,
      lon: -4.25,
      label: 'Glasgow, Glasgow, United Kingdom',
      provider: 'photon',
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('photon.komoot.io'));
  });

  it('uses Mapbox when provider is mapbox and token is set', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [{ center: [-4.25, 55.86], place_name: 'Glasgow, Scotland' }],
      }),
    } as Response);

    const result = await geocodeQuery('Glasgow', {
      provider: 'mapbox',
      mapboxToken: 'pk.test',
    });

    expect(result).toEqual({
      lat: 55.86,
      lon: -4.25,
      label: 'Glasgow, Scotland',
      provider: 'mapbox',
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('api.mapbox.com'));
  });

  it('returns null when no results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    } as Response);

    const result = await geocodeQuery('nowhere-xyz', { provider: 'photon' });
    expect(result).toBeNull();
  });

  it('throws when query is empty', async () => {
    await expect(geocodeQuery('  ', { provider: 'photon' })).rejects.toThrow(GeocodeError);
  });

  it('throws when Mapbox is selected without a token', async () => {
    await expect(geocodeQuery('Glasgow', { provider: 'mapbox' })).rejects.toThrow(
      'Mapbox token required',
    );
  });
});
