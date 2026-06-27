import { isValidLocator } from '../../maidenhead.ts';
import { coordsToLocator } from '../../maidenhead.ts';
import { geocodeQuery } from '../../geocode.ts';
import type { GeocodeProvider } from '../../geocode.ts';
import { resolveGeocodeProviderChoice } from '../../geocodeProviderChoice.ts';
import { looksLikeTownName, looksLikeUkPostcode } from '../../ukPostcode.ts';
import { fetchByBand, fetchByCallsign, fetchByKeeper, fetchByLocator } from './client.ts';
import {
  pipelineBrowserLocationStep,
  pipelineEtccBandStep,
  pipelineEtccCallsignStep,
  pipelineEtccKeeperStep,
  pipelineEtccLocatorStep,
  pipelineGeocodeNoResultsStep,
  pipelineGeocodeResponseStep,
  pipelineGeocoderStep,
  pipelineInputStep,
  pipelineLocatorStep,
  pipelineTownFilterStep,
  type SearchPipelineStep,
} from './searchPipeline.ts';
import type { EtccListing } from './types.ts';

export type { SearchPipelineStep } from './searchPipeline.ts';

export type UkRepeaterSearchMode =
  | 'auto'
  | 'postcode'
  | 'address'
  | 'town'
  | 'myLocation'
  | 'callsign'
  | 'keeper'
  | 'locator'
  | 'band';

export type QueryKind = 'callsign' | 'keeper' | 'locator' | 'band' | 'location';

export type ResolvedLocationSource = 'geocode' | 'browser';

const BAND_TOKENS = new Set(['2m', '4m', '6m', '10m', '23cm', '70cm', '13cm', '3cm', '9cm', '40m']);

/** UK-style callsign — must include at least one digit (avoids town names like Derby). */
const CALLSIGN_RE = /^[A-Z0-9][A-Z0-9/-]{1,11}$/i;

function looksLikeCallsign(query: string): boolean {
  const compact = query.trim().replace(/\s/g, '');
  if (!CALLSIGN_RE.test(compact)) return false;
  return /\d/.test(compact);
}

export interface ResolvedLocation {
  source: ResolvedLocationSource;
  provider?: GeocodeProvider;
  providerReason?: string;
  query?: string;
  label: string;
  lat: number;
  lon: number;
  locator: string;
  accuracyMeters?: number | null;
}

export interface QueryRouteResult {
  kind: QueryKind;
  listings: EtccListing[];
  resolvedLocation?: ResolvedLocation;
  pipeline: SearchPipelineStep[];
}

export interface SearchFilters {
  operationalOnly?: boolean;
  townSubstring?: string;
  band?: string;
}

export interface RouteQueryOptions {
  mode?: UkRepeaterSearchMode;
  geocodeProvider?: GeocodeProvider;
  mapboxToken?: string;
}

export function detectQueryKind(query: string): QueryKind {
  const trimmed = query.trim();
  if (!trimmed) return 'location';
  const lower = trimmed.toLowerCase();
  if (BAND_TOKENS.has(lower)) return 'band';
  if (/\s/.test(trimmed) && looksLikeUkPostcode(trimmed)) return 'location';
  if (isValidLocator(trimmed)) return 'locator';
  if (looksLikeUkPostcode(trimmed)) return 'location';
  if (looksLikeCallsign(trimmed)) return 'callsign';
  return 'location';
}

/** Whether geocode results should be narrowed by listing town substring. */
export function shouldApplyTownSubstring(query: string, mode: UkRepeaterSearchMode): boolean {
  if (mode === 'town') return true;
  if (mode !== 'auto') return false;
  return shouldApplyTownSubstringForAuto(query);
}

/** Whether auto-mode geocode results should be narrowed by listing town substring. */
export function shouldApplyTownSubstringForAuto(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (looksLikeUkPostcode(trimmed)) return false;
  return looksLikeTownName(trimmed);
}

function resolveAutoKind(query: string): QueryKind {
  return detectQueryKind(query);
}

function effectiveKindForMode(mode: UkRepeaterSearchMode, query: string): QueryKind {
  if (mode === 'auto') return resolveAutoKind(query);
  if (mode === 'postcode' || mode === 'address' || mode === 'town' || mode === 'myLocation') {
    return 'location';
  }
  return mode;
}

async function geocodeToListings(
  query: string,
  mode: UkRepeaterSearchMode,
  opts?: RouteQueryOptions,
): Promise<{
  listings: EtccListing[];
  resolvedLocation?: ResolvedLocation;
  pipeline: SearchPipelineStep[];
}> {
  const pipeline: SearchPipelineStep[] = [pipelineInputStep(query, mode)];
  const providerChoice = resolveGeocodeProviderChoice({
    mapboxToken: opts?.mapboxToken,
    provider: opts?.geocodeProvider,
  });
  pipeline.push(pipelineGeocoderStep(providerChoice.provider, providerChoice.reason));

  const geo = await geocodeQuery(query, {
    provider: providerChoice.provider,
    mapboxToken: opts?.mapboxToken,
  });
  if (!geo) {
    pipeline.push(pipelineGeocodeNoResultsStep(providerChoice.provider, query));
    return { listings: [], pipeline };
  }

  pipeline.push(pipelineGeocodeResponseStep(geo.provider, geo.label, geo.lat, geo.lon));
  const locator = coordsToLocator(geo.lat, geo.lon, 4);
  pipeline.push(pipelineLocatorStep(locator));
  const listings = await fetchByLocator(locator);
  pipeline.push(pipelineEtccLocatorStep(locator, listings.length));

  return {
    listings,
    pipeline,
    resolvedLocation: {
      source: 'geocode',
      provider: geo.provider,
      providerReason: providerChoice.reason,
      query,
      label: geo.label,
      lat: geo.lat,
      lon: geo.lon,
      locator,
    },
  };
}

async function coordsToListings(
  lat: number,
  lon: number,
  opts?: { accuracyMeters?: number | null },
): Promise<{
  listings: EtccListing[];
  resolvedLocation: ResolvedLocation;
  pipeline: SearchPipelineStep[];
}> {
  const pipeline: SearchPipelineStep[] = [
    pipelineBrowserLocationStep(lat, lon, opts?.accuracyMeters),
  ];
  const locator = coordsToLocator(lat, lon, 4);
  pipeline.push(pipelineLocatorStep(locator));
  const listings = await fetchByLocator(locator);
  pipeline.push(pipelineEtccLocatorStep(locator, listings.length));

  return {
    listings,
    pipeline,
    resolvedLocation: {
      source: 'browser',
      label: 'Your location',
      lat,
      lon,
      locator,
      accuracyMeters: opts?.accuracyMeters,
    },
  };
}

export function filterListings(
  listings: EtccListing[],
  filters: SearchFilters = {},
): EtccListing[] {
  let result = listings;
  if (filters.operationalOnly) {
    result = result.filter((l) => l.status.toUpperCase() === 'OPERATIONAL');
  }
  if (filters.band?.trim()) {
    const band = filters.band.trim().toUpperCase();
    result = result.filter((l) => l.band.toUpperCase() === band);
  }
  if (filters.townSubstring?.trim()) {
    const needle = filters.townSubstring.trim().toUpperCase();
    result = result.filter((l) => (l.town ?? '').toUpperCase().includes(needle));
  }
  return result;
}

export async function routeQuery(
  query: string,
  opts?: RouteQueryOptions,
): Promise<QueryRouteResult> {
  const trimmed = query.trim();
  const mode = opts?.mode ?? 'auto';

  if (!trimmed) {
    return { kind: 'location', listings: [], pipeline: [] };
  }

  const kind = effectiveKindForMode(mode, trimmed);

  if (kind === 'callsign') {
    const pipeline = [pipelineInputStep(trimmed, mode)];
    const listings = await fetchByCallsign(trimmed);
    pipeline.push(pipelineEtccCallsignStep(trimmed, listings.length));
    return { kind, listings, pipeline };
  }
  if (kind === 'keeper') {
    const pipeline = [pipelineInputStep(trimmed, mode)];
    const listings = await fetchByKeeper(trimmed);
    pipeline.push(pipelineEtccKeeperStep(trimmed, listings.length));
    return { kind, listings, pipeline };
  }
  if (kind === 'locator') {
    const pipeline = [pipelineInputStep(trimmed, mode)];
    if (!isValidLocator(trimmed)) {
      return { kind, listings: [], pipeline };
    }
    const listings = await fetchByLocator(trimmed);
    pipeline.push(pipelineEtccLocatorStep(trimmed, listings.length));
    return { kind, listings, pipeline };
  }
  if (kind === 'band') {
    const pipeline = [pipelineInputStep(trimmed, mode)];
    const listings = await fetchByBand(trimmed);
    pipeline.push(pipelineEtccBandStep(trimmed, listings.length));
    return { kind, listings, pipeline };
  }

  const { listings, resolvedLocation, pipeline } = await geocodeToListings(trimmed, mode, opts);
  return { kind: 'location', listings, resolvedLocation, pipeline };
}

function applyFiltersWithPipeline(
  listings: EtccListing[],
  filters: SearchFilters,
  pipeline: SearchPipelineStep[],
  townNeedle?: string,
): { listings: EtccListing[]; pipeline: SearchPipelineStep[] } {
  const nextPipeline = [...pipeline];
  let result = listings;

  if (filters.operationalOnly) {
    const before = result.length;
    result = result.filter((l) => l.status.toUpperCase() === 'OPERATIONAL');
    if (before !== result.length) {
      nextPipeline.push({
        text: `Operational only: ${before} → ${result.length} listing${result.length === 1 ? '' : 's'}`,
      });
    }
  }

  if (filters.band?.trim()) {
    const band = filters.band.trim().toUpperCase();
    const before = result.length;
    result = result.filter((l) => l.band.toUpperCase() === band);
    if (before !== result.length) {
      nextPipeline.push({
        text: `Band filter ${band}: ${before} → ${result.length} listing${result.length === 1 ? '' : 's'}`,
      });
    }
  }

  if (townNeedle?.trim()) {
    const needle = townNeedle.trim();
    const before = result.length;
    result = result.filter((l) => (l.town ?? '').toUpperCase().includes(needle.toUpperCase()));
    nextPipeline.push(pipelineTownFilterStep(needle, before, result.length));
  }

  return { listings: result, pipeline: nextPipeline };
}

export async function searchUkRepeaters(
  query: string,
  filters: SearchFilters = {},
  opts?: RouteQueryOptions,
): Promise<QueryRouteResult> {
  const mode = opts?.mode ?? 'auto';
  const { kind, listings, resolvedLocation, pipeline } = await routeQuery(query, opts);
  const townNeedle = shouldApplyTownSubstring(query, mode) ? query.trim() : filters.townSubstring;
  const filtered = applyFiltersWithPipeline(listings, filters, pipeline, townNeedle);
  return {
    kind,
    resolvedLocation,
    listings: filtered.listings,
    pipeline: filtered.pipeline,
  };
}

export async function searchUkRepeatersAtCoords(
  lat: number,
  lon: number,
  filters: SearchFilters = {},
  opts?: { accuracyMeters?: number | null },
): Promise<QueryRouteResult> {
  const { listings, resolvedLocation, pipeline } = await coordsToListings(lat, lon, opts);
  const filtered = applyFiltersWithPipeline(listings, filters, pipeline);
  return {
    kind: 'location',
    resolvedLocation,
    listings: filtered.listings,
    pipeline: filtered.pipeline,
  };
}
