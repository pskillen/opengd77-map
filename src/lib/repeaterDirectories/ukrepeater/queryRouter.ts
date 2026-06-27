import { isValidLocator } from '../../maidenhead.ts';
import { coordsToLocator } from '../../maidenhead.ts';
import { geocodeQuery } from '../../geocode.ts';
import type { GeocodeProvider } from '../../geocode.ts';
import { looksLikeTownName, looksLikeUkPostcode } from '../../ukPostcode.ts';
import { fetchByBand, fetchByCallsign, fetchByKeeper, fetchByLocator } from './client.ts';
import type { EtccListing } from './types.ts';

export type UkRepeaterSearchMode =
  | 'auto'
  | 'postcode'
  | 'address'
  | 'town'
  | 'callsign'
  | 'keeper'
  | 'locator'
  | 'band';

export type QueryKind = 'callsign' | 'keeper' | 'locator' | 'band' | 'location';

const BAND_TOKENS = new Set(['2m', '4m', '6m', '10m', '23cm', '70cm', '13cm', '3cm', '9cm', '40m']);

/** UK-style callsign — must include at least one digit (avoids town names like Derby). */
const CALLSIGN_RE = /^[A-Z0-9][A-Z0-9/-]{1,11}$/i;

function looksLikeCallsign(query: string): boolean {
  const compact = query.trim().replace(/\s/g, '');
  if (!CALLSIGN_RE.test(compact)) return false;
  return /\d/.test(compact);
}

export interface ResolvedLocation {
  provider: GeocodeProvider;
  label: string;
  lat: number;
  lon: number;
  locator: string;
}

export interface QueryRouteResult {
  kind: QueryKind;
  listings: EtccListing[];
  resolvedLocation?: ResolvedLocation;
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
export function shouldApplyTownSubstring(
  query: string,
  mode: UkRepeaterSearchMode,
): boolean {
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
  if (mode === 'postcode' || mode === 'address' || mode === 'town') return 'location';
  return mode;
}

async function geocodeToListings(
  query: string,
  opts?: RouteQueryOptions,
): Promise<{ listings: EtccListing[]; resolvedLocation?: ResolvedLocation }> {
  const geo = await geocodeQuery(query, {
    provider: opts?.geocodeProvider,
    mapboxToken: opts?.mapboxToken,
  });
  if (!geo) {
    return { listings: [] };
  }
  const locator = coordsToLocator(geo.lat, geo.lon, 4);
  const listings = await fetchByLocator(locator);
  return {
    listings,
    resolvedLocation: {
      provider: geo.provider,
      label: geo.label,
      lat: geo.lat,
      lon: geo.lon,
      locator,
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
    return { kind: 'location', listings: [] };
  }

  const kind = effectiveKindForMode(mode, trimmed);

  if (kind === 'callsign') {
    return { kind, listings: await fetchByCallsign(trimmed) };
  }
  if (kind === 'keeper') {
    return { kind, listings: await fetchByKeeper(trimmed) };
  }
  if (kind === 'locator') {
    if (!isValidLocator(trimmed)) {
      return { kind, listings: [] };
    }
    return { kind, listings: await fetchByLocator(trimmed) };
  }
  if (kind === 'band') {
    return { kind, listings: await fetchByBand(trimmed) };
  }

  const { listings, resolvedLocation } = await geocodeToListings(trimmed, opts);
  return { kind: 'location', listings, resolvedLocation };
}

export async function searchUkRepeaters(
  query: string,
  filters: SearchFilters = {},
  opts?: RouteQueryOptions,
): Promise<QueryRouteResult> {
  const mode = opts?.mode ?? 'auto';
  const { kind, listings, resolvedLocation } = await routeQuery(query, opts);
  const townNeedle =
    shouldApplyTownSubstring(query, mode) ? query.trim() : filters.townSubstring;
  return {
    kind,
    resolvedLocation,
    listings: filterListings(listings, { ...filters, townSubstring: townNeedle }),
  };
}
