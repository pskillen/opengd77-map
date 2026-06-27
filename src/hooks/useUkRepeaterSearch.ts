import { useCallback, useState } from 'react';
import { GeocodeError } from '../lib/geocode.ts';
import {
  detectQueryKind,
  EtccDirectoryError,
  searchUkRepeaters,
} from '../lib/repeaterDirectories/registry.ts';
import type { EtccListing } from '../lib/repeaterDirectories/registry.ts';
import type {
  QueryKind,
  ResolvedLocation,
  UkRepeaterSearchMode,
} from '../lib/repeaterDirectories/ukrepeater/queryRouter.ts';
import { useMapSettings } from './useMapSettings.ts';

function kindForMode(mode: UkRepeaterSearchMode): QueryKind | null {
  if (mode === 'auto') return null;
  if (mode === 'postcode' || mode === 'address' || mode === 'town') return 'location';
  return mode;
}

const EMPTY_QUERY_HINTS: Record<UkRepeaterSearchMode, string> = {
  auto: 'Enter a callsign, locator, band, postcode, address, or town.',
  postcode: 'Enter a UK postcode.',
  address: 'Enter a street address.',
  town: 'Enter a town or city name.',
  callsign: 'Enter a repeater callsign.',
  keeper: 'Enter a keeper callsign.',
  locator: 'Enter a 4- or 6-character Maidenhead locator.',
  band: 'Enter a band (e.g. 2m, 70cm).',
};

export interface UkRepeaterSearchState {
  query: string;
  searchMode: UkRepeaterSearchMode;
  operationalOnly: boolean;
  bandFilter: string | null;
  loading: boolean;
  error: string | null;
  kind: QueryKind | null;
  resolvedLocation: ResolvedLocation | null;
  listings: EtccListing[];
}

export function useUkRepeaterSearch() {
  const { mapboxToken } = useMapSettings();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<UkRepeaterSearchMode>('auto');
  const [operationalOnly, setOperationalOnly] = useState(true);
  const [bandFilter, setBandFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<QueryKind | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedLocation | null>(null);
  const [listings, setListings] = useState<EtccListing[]>([]);

  const search = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError(EMPTY_QUERY_HINTS[searchMode]);
      return;
    }

    setLoading(true);
    setError(null);
    setResolvedLocation(null);
    try {
      const result = await searchUkRepeaters(
        trimmed,
        {
          operationalOnly,
          band: bandFilter ?? undefined,
        },
        {
          mode: searchMode,
          mapboxToken: mapboxToken.trim() || undefined,
        },
      );
      setKind(result.kind);
      setResolvedLocation(result.resolvedLocation ?? null);
      setListings(result.listings);
      if (result.listings.length === 0) {
        if (result.resolvedLocation) {
          setError(`No repeaters found in locator square ${result.resolvedLocation.locator}.`);
        } else if (result.kind === 'location') {
          setError('No location found for that search.');
        } else {
          setError('No repeaters matched your search.');
        }
      }
    } catch (err) {
      setListings([]);
      setResolvedLocation(null);
      setKind(kindForMode(searchMode) ?? detectQueryKind(trimmed));
      if (err instanceof GeocodeError) {
        setError(err.message);
      } else if (err instanceof EtccDirectoryError) {
        setError(err.message);
      } else {
        setError('Search failed — try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [query, searchMode, operationalOnly, bandFilter, mapboxToken]);

  return {
    query,
    setQuery,
    searchMode,
    setSearchMode,
    operationalOnly,
    setOperationalOnly,
    bandFilter,
    setBandFilter,
    loading,
    error,
    kind,
    resolvedLocation,
    listings,
    search,
  };
}
