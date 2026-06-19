import L from 'leaflet';
import { useMemo, useState } from 'react';
import { Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import {
  computeGridLabels,
  computeGridLines,
  type MaidenheadGridMode,
} from '../../lib/maidenheadGrid.ts';

const LINE_STYLE = {
  4: { color: '#666', weight: 1.5, opacity: 0.35 },
  6: { color: '#888', weight: 1, opacity: 0.2 },
  8: { color: '#999', weight: 0.75, opacity: 0.15 },
} as const;

function boundsFromLeaflet(bounds: L.LatLngBounds) {
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  };
}

function safeMapBounds(map: L.Map) {
  if (typeof map.getBounds === 'function') {
    return boundsFromLeaflet(map.getBounds());
  }
  return { south: 49, west: -11, north: 61, east: 2 };
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelIcon(text: string): L.DivIcon {
  return L.divIcon({
    className: 'maidenhead-grid-label-wrap',
    html: `<span class="maidenhead-grid-label">${escapeHtml(text)}</span>`,
    iconAnchor: [0, 0],
  });
}

export interface MaidenheadGridLayerProps {
  mode: MaidenheadGridMode;
}

export default function MaidenheadGridLayer({ mode }: MaidenheadGridLayerProps) {
  const map = useMap();
  const [bounds, setBounds] = useState(() => safeMapBounds(map));
  const [zoom, setZoom] = useState(() => map.getZoom?.() ?? 6);

  const syncView = () => {
    setBounds(safeMapBounds(map));
    if (typeof map.getZoom === 'function') setZoom(map.getZoom());
  };

  useMapEvents({
    moveend: syncView,
    zoomend: syncView,
  });

  const lines = useMemo(
    () => (mode === 'off' ? [] : computeGridLines(bounds, mode, undefined, zoom)),
    [bounds, mode, zoom],
  );
  const labels = useMemo(
    () => (mode === 'off' ? [] : computeGridLabels(bounds, mode, undefined, zoom)),
    [bounds, mode, zoom],
  );

  if (mode === 'off') return null;

  return (
    <>
      {lines.map((line, index) => (
        <Polyline
          key={`${line.level}-${index}-${line.positions[0][0]}-${line.positions[0][1]}`}
          positions={line.positions}
          pathOptions={LINE_STYLE[line.level]}
          interactive={false}
        />
      ))}
      {labels.map((label) => (
        <Marker
          key={`${label.level}-${label.text}-${label.position[0]}-${label.position[1]}`}
          position={label.position}
          icon={labelIcon(label.text)}
          interactive={false}
        />
      ))}
    </>
  );
}
