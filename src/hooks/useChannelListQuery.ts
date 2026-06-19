import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  defaultMaxDistanceKm,
  parseCsvParam,
  parseMaxDistanceKm,
  serializeCsvParam,
  type ChannelSortMode,
} from './channelListQueryUtils.ts';

export interface ChannelListQuery {
  nameFilter: string;
  sortMode: ChannelSortMode;
  bandFilter: string[];
  modeFilter: string[];
  duplexFilter: string | null;
  distanceFilterEnabled: boolean;
  maxDistanceKm: number;
  setNameFilter: (value: string) => void;
  setSortMode: (value: ChannelSortMode) => void;
  setBandFilter: (value: string[]) => void;
  setModeFilter: (value: string[]) => void;
  setDuplexFilter: (value: string | null) => void;
  setDistanceFilterEnabled: (value: boolean) => void;
  setMaxDistanceKm: (value: number) => void;
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value);
  else params.delete(key);
}

export function useChannelListQuery(): ChannelListQuery {
  const [searchParams, setSearchParams] = useSearchParams();

  const nameFilter = searchParams.get('q') ?? '';
  const sortMode: ChannelSortMode = searchParams.get('sort') === 'distance' ? 'distance' : 'name';
  const bandFilter = useMemo(() => parseCsvParam(searchParams.get('band')), [searchParams]);
  const modeFilter = useMemo(() => parseCsvParam(searchParams.get('mode')), [searchParams]);
  const duplexRaw = searchParams.get('duplex');
  const duplexFilter = duplexRaw === 'simplex' || duplexRaw === 'split' ? duplexRaw : null;
  const distanceFilterEnabled = searchParams.get('distance') === '1';
  const maxDistanceKm = parseMaxDistanceKm(searchParams.get('maxKm'));

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setNameFilter = useCallback(
    (value: string) => updateParams((p) => setOrDelete(p, 'q', value || null)),
    [updateParams],
  );

  const setSortMode = useCallback(
    (value: ChannelSortMode) =>
      updateParams((p) => setOrDelete(p, 'sort', value === 'name' ? null : value)),
    [updateParams],
  );

  const setBandFilter = useCallback(
    (value: string[]) => updateParams((p) => setOrDelete(p, 'band', serializeCsvParam(value))),
    [updateParams],
  );

  const setModeFilter = useCallback(
    (value: string[]) => updateParams((p) => setOrDelete(p, 'mode', serializeCsvParam(value))),
    [updateParams],
  );

  const setDuplexFilter = useCallback(
    (value: string | null) => updateParams((p) => setOrDelete(p, 'duplex', value)),
    [updateParams],
  );

  const setDistanceFilterEnabled = useCallback(
    (value: boolean) => updateParams((p) => setOrDelete(p, 'distance', value ? '1' : null)),
    [updateParams],
  );

  const setMaxDistanceKm = useCallback(
    (value: number) => {
      const km = Number.isFinite(value) ? value : defaultMaxDistanceKm();
      updateParams((p) =>
        setOrDelete(p, 'maxKm', km === defaultMaxDistanceKm() ? null : String(km)),
      );
    },
    [updateParams],
  );

  return {
    nameFilter,
    sortMode,
    bandFilter,
    modeFilter,
    duplexFilter,
    distanceFilterEnabled,
    maxDistanceKm,
    setNameFilter,
    setSortMode,
    setBandFilter,
    setModeFilter,
    setDuplexFilter,
    setDistanceFilterEnabled,
    setMaxDistanceKm,
  };
}
