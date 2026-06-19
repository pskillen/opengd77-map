import { useCallback, useMemo, useState } from 'react';
import type { MaidenheadGridMode } from '../lib/maidenheadGrid.ts';
import {
  resolveTileConfig,
  STORAGE_KEY_MAIDENHEAD_GRID,
  STORAGE_KEY_TILE,
  STORAGE_KEY_TOKEN,
  type TileProvider,
} from '../lib/mapTiles.ts';

function readMaidenheadGridMode(): MaidenheadGridMode {
  const saved = localStorage.getItem(STORAGE_KEY_MAIDENHEAD_GRID);
  return saved === '4' || saved === '6' || saved === '8' ? saved : 'off';
}

export function useMapSettings() {
  const [tileProvider, setTileProviderState] = useState<TileProvider>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TILE);
    return saved === 'mapbox' || saved === 'mapbox-sat' ? saved : 'osm';
  });
  const [mapboxToken, setMapboxToken] = useState(
    () => localStorage.getItem(STORAGE_KEY_TOKEN) ?? '',
  );
  const [maidenheadGrid, setMaidenheadGridState] =
    useState<MaidenheadGridMode>(readMaidenheadGridMode);

  const tileConfig = useMemo(
    () => resolveTileConfig(tileProvider, mapboxToken),
    [tileProvider, mapboxToken],
  );

  const setTileProvider = useCallback((provider: TileProvider) => {
    setTileProviderState(provider);
    localStorage.setItem(STORAGE_KEY_TILE, provider);
  }, []);

  const setMaidenheadGrid = useCallback((mode: MaidenheadGridMode) => {
    setMaidenheadGridState(mode);
    localStorage.setItem(STORAGE_KEY_MAIDENHEAD_GRID, mode);
  }, []);

  const saveToken = useCallback(() => {
    const t = mapboxToken.trim();
    if (t) localStorage.setItem(STORAGE_KEY_TOKEN, t);
    localStorage.setItem(STORAGE_KEY_TILE, tileProvider);
  }, [mapboxToken, tileProvider]);

  const clearToken = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    setMapboxToken('');
  }, []);

  return {
    tileProvider,
    setTileProvider,
    mapboxToken,
    setMapboxToken,
    maidenheadGrid,
    setMaidenheadGrid,
    tileConfig,
    saveToken,
    clearToken,
  };
}
