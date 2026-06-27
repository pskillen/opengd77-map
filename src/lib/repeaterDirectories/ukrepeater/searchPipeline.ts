import { geocodeProviderLabel } from '../../geocodeProviderChoice.ts';
import type { GeocodeProvider } from '../../geocode.ts';
import type { UkRepeaterSearchMode } from './queryRouter.ts';

export interface SearchPipelineStep {
  text: string;
}

const MODE_LABELS: Record<UkRepeaterSearchMode, string> = {
  auto: 'Auto',
  postcode: 'Postcode',
  address: 'Address',
  town: 'Town',
  callsign: 'Repeater callsign',
  keeper: 'Keeper callsign',
  locator: 'Locator',
  band: 'Band',
  myLocation: 'My location',
};

export function searchModeLabel(mode: UkRepeaterSearchMode): string {
  return MODE_LABELS[mode];
}

export function formatLatLon(lat: number, lon: number): string {
  const latHem = lat >= 0 ? 'N' : 'S';
  const lonHem = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latHem}, ${Math.abs(lon).toFixed(4)}° ${lonHem}`;
}

export function pipelineInputStep(query: string, mode: UkRepeaterSearchMode): SearchPipelineStep {
  return { text: `Search input (${searchModeLabel(mode)}): ${query}` };
}

export function pipelineGeocoderStep(
  provider: GeocodeProvider,
  reason?: string,
): SearchPipelineStep {
  const label = geocodeProviderLabel(provider);
  const detail = reason?.trim();
  return {
    text: detail ? `Geocoder: ${label} (${detail})` : `Geocoder: ${label}`,
  };
}

export function pipelineGeocodeNoResultsStep(
  provider: GeocodeProvider,
  query: string,
): SearchPipelineStep {
  return {
    text: `${geocodeProviderLabel(provider)} response: no match for "${query}"`,
  };
}

export function pipelineGeocodeResponseStep(
  provider: GeocodeProvider,
  label: string,
  lat: number,
  lon: number,
): SearchPipelineStep {
  return {
    text: `${geocodeProviderLabel(provider)} response: "${label}" at ${formatLatLon(lat, lon)}`,
  };
}

export function pipelineBrowserLocationStep(
  lat: number,
  lon: number,
  accuracyMeters?: number | null,
): SearchPipelineStep {
  const accuracy =
    accuracyMeters != null && Number.isFinite(accuracyMeters)
      ? ` (±${Math.round(accuracyMeters)} m)`
      : '';
  return {
    text: `Browser geolocation: ${formatLatLon(lat, lon)}${accuracy}`,
  };
}

export function pipelineLocatorStep(locator: string): SearchPipelineStep {
  return {
    text: `Converted to 4-character Maidenhead locator: ${locator.toUpperCase()}`,
  };
}

export function pipelineEtccLocatorStep(locator: string, count: number): SearchPipelineStep {
  return {
    text: `ukrepeater.net: GET /locator/${locator.toLowerCase()} → ${count} listing${count === 1 ? '' : 's'}`,
  };
}

export function pipelineEtccCallsignStep(callsign: string, count: number): SearchPipelineStep {
  return {
    text: `ukrepeater.net: GET /callsign/${callsign.toLowerCase()} → ${count} listing${count === 1 ? '' : 's'}`,
  };
}

export function pipelineEtccKeeperStep(callsign: string, count: number): SearchPipelineStep {
  return {
    text: `ukrepeater.net: GET /keeper/${callsign.toLowerCase()} → ${count} listing${count === 1 ? '' : 's'}`,
  };
}

export function pipelineEtccBandStep(band: string, count: number): SearchPipelineStep {
  return {
    text: `ukrepeater.net: GET /band/${band.toLowerCase()} → ${count} listing${count === 1 ? '' : 's'}`,
  };
}

export function pipelineTownFilterStep(
  needle: string,
  before: number,
  after: number,
): SearchPipelineStep {
  return {
    text: `Town filter "${needle}": ${before} → ${after} listing${after === 1 ? '' : 's'}`,
  };
}
