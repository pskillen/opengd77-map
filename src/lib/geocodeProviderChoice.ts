import type { GeocodeProvider } from './geocode.ts';

export interface GeocodeProviderChoice {
  provider: GeocodeProvider;
  /** Short note for the pipeline — never repeats the provider name. */
  reason?: string;
}

export function resolveGeocodeProviderChoice(opts?: {
  mapboxToken?: string;
  provider?: GeocodeProvider;
}): GeocodeProviderChoice {
  if (opts?.provider) {
    return { provider: opts.provider, reason: 'explicitly selected' };
  }
  if (opts?.mapboxToken?.trim()) {
    return { provider: 'mapbox', reason: 'token from Settings' };
  }
  return { provider: 'photon' };
}

export function geocodeProviderLabel(provider: GeocodeProvider): string {
  return provider === 'mapbox' ? 'Mapbox' : 'Photon (OpenStreetMap)';
}
