export const STORAGE_KEY_TOKEN = 'mm9pdy-codeplug-tool.channel-map.mapboxToken';
export const STORAGE_KEY_TILE = 'mm9pdy-codeplug-tool.channel-map.tileProvider';

export type TileProvider = 'osm' | 'mapbox' | 'mapbox-sat';

export interface TileLayerConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  tileSize?: number;
  zoomOffset?: number;
}

export function tileLayerConfig(provider: TileProvider, token: string): TileLayerConfig {
  if (provider === 'mapbox' || provider === 'mapbox-sat') {
    if (!token) {
      return {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      };
    }
    const style = provider === 'mapbox-sat' ? 'mapbox/satellite-v9' : 'mapbox/streets-v12';
    return {
      url: `https://api.mapbox.com/styles/v1/${style}/tiles/{z}/{x}/{y}?access_token=${token}`,
      attribution:
        '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 20,
      tileSize: 512,
      zoomOffset: -1,
    };
  }
  return {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  };
}

export function resolveTileConfig(
  tileProvider: TileProvider,
  mapboxToken: string,
): { config: TileLayerConfig; fallback: boolean } {
  const needsMapbox = tileProvider === 'mapbox' || tileProvider === 'mapbox-sat';
  const token = mapboxToken.trim();
  if (needsMapbox && !token) {
    return { config: tileLayerConfig('osm', ''), fallback: true };
  }
  return { config: tileLayerConfig(tileProvider, token), fallback: false };
}
