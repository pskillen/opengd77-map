import { useCallback, useState } from 'react';
import { GeocodeError } from '../lib/geocode.ts';
import {
  detectQueryKind,
  EtccDirectoryError,
  searchUkRepeaters,
  searchUkRepeatersAtCoords,
} from '../lib/repeaterDirectories/registry.ts';
import type { EtccListing } from '../lib/repeaterDirectories/registry.ts';
import type {
  QueryKind,
  ResolvedLocation,
  UkRepeaterSearchMode,
} from '../lib/repeaterDirectories/ukrepeater/queryRouter.ts';
import type { SearchPipelineStep } from '../lib/repeaterDirectories/ukrepeater/searchPipeline.ts';
import { useMapSettings } from './useMapSettings.ts';

function kindForMode(mode: UkRepeaterSearchMode): QueryKind | null {
  if (mode === 'auto') return null;
  if (mode === 'postcode' || mode === 'address' || mode === 'town' || mode === 'myLocation') {
    return 'location';
  }
  return mode;
}

const EMPTY_QUERY_HINTS: Record<UkRepeaterSearchMode, string> = {
  auto: 'Enter a callsign, locator, band, postcode, address, or town.',
  postcode: 'Enter a UK postcode.',
  address: 'Enter a street address.',
  town: 'Enter a town or city name.',
  myLocation: 'Click "Use my location" to search nearby repeaters.',
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
  pipeline: SearchPipelineStep[];
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
  const [pipeline, setPipeline] = useState<SearchPipelineStep[]>([]);
  const [listings, setListings] = useState<EtccListing[]>([]);

  const applyResult = useCallback(
    (result: {
      kind: QueryKind;
      listings: EtccListing[];
      resolvedLocation?: ResolvedLocation;
      pipeline: SearchPipelineStep[];
    }) => {
      setKind(result.kind);
      setResolvedLocation(result.resolvedLocation ?? null);
      setPipeline(result.pipeline);
      setListings(result.listings);
      if (result.listings.length === 0) {
        if (result.resolvedLocation) {
          setError(`No repeaters found in locator square ${result.resolvedLocation.locator}.`);
        } else if (result.kind === 'location') {
          setError('Geocoder returned no match — see steps above.');
        } else {
          setError('No repeaters matched your search.');
        }
      }
    },
    [],
  );

  const searchFilters = useCallback(
    () => ({
      operationalOnly,
      band: bandFilter ?? undefined,
    }),
    [operationalOnly, bandFilter],
  );

  const search = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError(EMPTY_QUERY_HINTS[searchMode]);
      return;
    }

    setLoading(true);
    setError(null);
    setResolvedLocation(null);
    setPipeline([]);
    try {
      const result = await searchUkRepeaters(trimmed, searchFilters(), {
        mode: searchMode,
        mapboxToken: mapboxToken.trim() || undefined,
      });
      applyResult(result);
    } catch (err) {
      setListings([]);
      setResolvedLocation(null);
      setPipeline([]);
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
  }, [query, searchMode, searchFilters, mapboxToken, applyResult]);

  const searchAtCoords = useCallback(
    async (lat: number, lon: number, accuracyMeters?: number | null) => {
      setLoading(true);
      setError(null);
      setResolvedLocation(null);
      setPipeline([]);
      try {
        const result = await searchUkRepeatersAtCoords(lat, lon, searchFilters(), {
          accuracyMeters,
        });
        applyResult(result);
      } catch (err) {
        setListings([]);
        setResolvedLocation(null);
        setPipeline([]);
        setKind('location');
        if (err instanceof EtccDirectoryError) {
          setError(err.message);
        } else {
          setError('Search failed — try again later.');
        }
      } finally {
        setLoading(false);
      }
    },
    [searchFilters, applyResult],
  );

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
    pipeline,
    listings,
    search,
    searchAtCoords,
  };
}
