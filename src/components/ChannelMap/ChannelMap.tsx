import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  Fieldset,
  Group,
  PasswordInput,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import {
  applyFilters,
  buildChannelIndex,
  CHANNEL_COLORS,
  dominantType,
  groupByCoords,
  markerColor,
  markerLabel,
  zoneGeolocatedPoints,
  type FilterOptions,
} from '../../lib/channels.ts';
import { parseChannelsCsv, parseZonesCsv, type Channel, type Zone } from '../../lib/csv.ts';
import { convexHullLatLon, zoneColor, type LatLon } from '../../lib/geo.ts';
import { collectMapPoints, computeMapView } from '../../lib/mapView.ts';
import { useDocumentLayoutReady } from '../../hooks/useDocumentLayoutReady.ts';
import './ChannelMap.css';

const STORAGE_KEY_TOKEN = 'opengd77-channel-map.mapboxToken';
const STORAGE_KEY_TILE = 'opengd77-channel-map.tileProvider';

type TileProvider = 'osm' | 'mapbox' | 'mapbox-sat';

interface ZoneHullData {
  zone: Zone;
  index: number;
  points: LatLon[];
  missing: { name: string; reason: string }[];
  colors: ReturnType<typeof zoneColor>;
  shapeNote: string;
  geometry: 'circle' | 'line' | 'polygon' | 'none';
  hull?: LatLon[];
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function channelDivIcon(color: string, label: string, merged: boolean): L.DivIcon {
  return L.divIcon({
    className: 'channel-marker-wrap',
    html: `<div class="channel-marker">
      <div class="channel-marker-dot${merged ? ' merged' : ''}" style="background:${color}"></div>
      <div class="channel-marker-label">${escapeHtml(label)}</div>
    </div>`,
    iconAnchor: [0, 0],
  });
}

function tileLayerConfig(
  provider: TileProvider,
  token: string,
): { url: string; attribution: string; maxZoom: number; tileSize?: number; zoomOffset?: number } {
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

function ChannelPopup({ group }: { group: Channel[] }) {
  const title =
    group.length === 1 ? group[0].callsign : `${group[0].callsign} (+${group.length - 1})`;

  return (
    <div style={{ minWidth: 180, maxWidth: 280 }}>
      <strong>{title}</strong>
      {group.map((ch) => {
        const freq = ch.rx && ch.tx ? `${ch.rx} / ${ch.tx} MHz` : '';
        const dmr =
          ch.type === 'Digital'
            ? [
                ch.contact && ch.contact !== 'None' ? `TX: ${ch.contact}` : null,
                ch.tgList && ch.tgList !== 'None' ? `RX list: ${ch.tgList}` : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : '';
        return (
          <div key={ch.name} style={{ marginBottom: '0.5rem' }}>
            <strong>{ch.name}</strong>
            <br />
            <span style={{ opacity: 0.85 }}>
              {ch.type}
              {freq ? ` · ${freq}` : ''}
            </span>
            {dmr ? (
              <>
                <br />
                <span style={{ opacity: 0.75, fontSize: '0.9em' }}>{dmr}</span>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FitMapBounds({
  groups,
  zoneHulls,
  showZoneHulls,
}: {
  groups: Channel[][];
  zoneHulls: ZoneHullData[];
  showZoneHulls: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const zonePoints = showZoneHulls ? zoneHulls.flatMap((zh) => zh.points) : [];
    const points = collectMapPoints(groups, zonePoints, showZoneHulls);
    const action = computeMapView(points, {
      padding: [48, 48],
      maxZoom: 11,
      singlePointZoom: 11,
    });

    if (!action) return;

    if (action.type === 'setView') {
      map.setView(action.center, action.zoom);
      return;
    }

    map.fitBounds(L.latLngBounds(action.southWest, action.northEast), {
      padding: action.padding,
      maxZoom: action.maxZoom,
    });
  }, [map, groups, zoneHulls, showZoneHulls]);

  return null;
}

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const parent = container.parentElement;
    if (!parent) return;

    const refresh = () => {
      if (document.readyState !== 'complete') return;
      map.invalidateSize();
    };

    const onLoad = () => refresh();
    if (document.readyState === 'complete') {
      requestAnimationFrame(refresh);
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    const observer = new ResizeObserver(() => refresh());
    observer.observe(parent);

    return () => {
      window.removeEventListener('load', onLoad);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

function Dropzone({ label, onFile }: { label: React.ReactNode; onFile: (file: File) => void }) {
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (file) onFile(file);
  };

  return (
    <Box
      className={`channel-map-dropzone${dragover ? ' dragover' : ''}`}
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragover(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragover(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragover(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragover(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      {label}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </Box>
  );
}

export default function ChannelMap() {
  const mapLayoutReady = useDocumentLayoutReady();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [requireUseLocation, setRequireUseLocation] = useState(true);
  const [skipZero, setSkipZero] = useState(true);
  const [dedupeCoords, setDedupeCoords] = useState(true);
  const [fullChannelName, setFullChannelName] = useState(false);
  const [showZoneHulls, setShowZoneHulls] = useState(true);
  const [tileProvider, setTileProvider] = useState<TileProvider>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TILE);
    return saved === 'mapbox' || saved === 'mapbox-sat' ? saved : 'osm';
  });
  const [mapboxToken, setMapboxToken] = useState(
    () => localStorage.getItem(STORAGE_KEY_TOKEN) ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [skippedOpen, { toggle: toggleSkipped }] = useDisclosure(false);
  const [zonesOpen, { toggle: toggleZones }] = useDisclosure(false);

  const filterOpts: FilterOptions = useMemo(
    () => ({ requireUseLocation, skipZero }),
    [requireUseLocation, skipZero],
  );

  const { plotted, skipped } = useMemo(
    () => applyFilters(channels, filterOpts),
    [channels, filterOpts],
  );

  const channelIndex = useMemo(() => buildChannelIndex(plotted), [plotted]);

  const groups = useMemo(() => groupByCoords(plotted, dedupeCoords), [plotted, dedupeCoords]);

  const zoneHulls: ZoneHullData[] = useMemo(() => {
    if (!zones.length || !showZoneHulls || !channelIndex.size) return [];

    return zones.map((zone, index) => {
      const { points, missing } = zoneGeolocatedPoints(zone, channelIndex, filterOpts);
      const colors = zoneColor(index);

      if (points.length === 0) {
        return {
          zone,
          index,
          points,
          missing,
          colors,
          shapeNote: `no geolocated members (${zone.members.length} in zone)`,
          geometry: 'none' as const,
        };
      }

      if (points.length === 1) {
        return {
          zone,
          index,
          points,
          missing,
          colors,
          shapeNote: '1 point (circle)',
          geometry: 'circle' as const,
        };
      }

      if (points.length === 2) {
        return {
          zone,
          index,
          points,
          missing,
          colors,
          shapeNote: '2 points (line)',
          geometry: 'line' as const,
        };
      }

      const hull = convexHullLatLon(points);
      return {
        zone,
        index,
        points,
        missing,
        colors,
        shapeNote: `${hull.length} hull verts / ${points.length} sites`,
        geometry: 'polygon' as const,
        hull,
      };
    });
  }, [zones, showZoneHulls, channelIndex, filterOpts]);

  const tileConfig = useMemo(() => {
    const needsMapbox = tileProvider === 'mapbox' || tileProvider === 'mapbox-sat';
    const token = mapboxToken.trim();
    if (needsMapbox && !token) {
      return { config: tileLayerConfig('osm', ''), fallback: true };
    }
    return { config: tileLayerConfig(tileProvider, token), fallback: false };
  }, [tileProvider, mapboxToken]);

  const loadChannelsFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setChannels(parseChannelsCsv(reader.result as string));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    reader.readAsText(file);
  }, []);

  const loadZonesFile = useCallback(
    (file: File) => {
      if (!channels.length) {
        setError('Load Channels.csv first so zone members can be resolved.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          setZones(parseZonesCsv(reader.result as string));
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      };
      reader.readAsText(file);
    },
    [channels.length],
  );

  const saveToken = () => {
    const t = mapboxToken.trim();
    if (t) localStorage.setItem(STORAGE_KEY_TOKEN, t);
    localStorage.setItem(STORAGE_KEY_TILE, tileProvider);
  };

  const clearToken = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    setMapboxToken('');
  };

  const handleTileProviderChange = (value: string | null) => {
    if (!value) return;
    const provider = value as TileProvider;
    setTileProvider(provider);
    localStorage.setItem(STORAGE_KEY_TILE, provider);
  };

  const statsText =
    channels.length === 0
      ? 'No file loaded.'
      : [
          `${plotted.length} channels plotted`,
          `(${groups.length} markers)`,
          `· ${channels.length} total in file`,
          `· ${skipped.length} skipped`,
          zones.length ? `· ${zones.length} zones` : '',
        ]
          .filter(Boolean)
          .join(' ');

  const displayedSkipped = skipped.slice(0, 200);

  return (
    <div className="channel-map">
      <aside className="channel-map-sidebar">
        <Title order={3}>OpenGD77 channel map</Title>
        <Text size="sm" c="dimmed">
          Load <code>Channels.csv</code>, then optionally <code>Zones.csv</code>, from an OpenGD77
          CPS export. Zone convex hulls use the same coordinate filters as markers.
        </Text>

        {error ? (
          <Alert color="red" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        ) : null}

        {tileConfig.fallback ? (
          <Alert color="yellow">
            Mapbox selected but no token set. Using OpenStreetMap instead.
          </Alert>
        ) : null}

        <Dropzone
          label={
            <>
              Drop <strong>Channels.csv</strong> here or click to browse
            </>
          }
          onFile={loadChannelsFile}
        />

        <Dropzone
          label={
            <>
              Drop <strong>Zones.csv</strong> here (after channels)
            </>
          }
          onFile={loadZonesFile}
        />

        <Fieldset legend="Filters">
          <Stack gap="xs">
            <Checkbox
              label={
                <>
                  Only <code>Use Location = Yes</code>
                </>
              }
              checked={requireUseLocation}
              onChange={(e) => setRequireUseLocation(e.currentTarget.checked)}
            />
            <Checkbox
              label="Skip 0,0 coordinates"
              checked={skipZero}
              onChange={(e) => setSkipZero(e.currentTarget.checked)}
            />
            <Checkbox
              label="Merge markers at same lat/lon"
              checked={dedupeCoords}
              onChange={(e) => setDedupeCoords(e.currentTarget.checked)}
            />
            <Checkbox
              label="Label with full channel name (default: first word)"
              checked={fullChannelName}
              onChange={(e) => setFullChannelName(e.currentTarget.checked)}
            />
            <Checkbox
              label="Draw zone convex hulls"
              checked={showZoneHulls}
              onChange={(e) => setShowZoneHulls(e.currentTarget.checked)}
            />
          </Stack>
        </Fieldset>

        <Fieldset legend="Map tiles (optional)">
          <Stack gap="xs">
            <Select
              label="Provider"
              data={[
                { value: 'osm', label: 'OpenStreetMap (default, no key)' },
                { value: 'mapbox', label: 'Mapbox streets' },
                { value: 'mapbox-sat', label: 'Mapbox satellite' },
              ]}
              value={tileProvider}
              onChange={handleTileProviderChange}
            />
            <PasswordInput
              label="Mapbox access token"
              placeholder="pk.… (saved in localStorage)"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.currentTarget.value)}
              autoComplete="off"
            />
            <Group grow>
              <Button variant="default" onClick={saveToken}>
                Save token
              </Button>
              <Button variant="default" onClick={clearToken}>
                Clear
              </Button>
            </Group>
          </Stack>
        </Fieldset>

        <div className="channel-map-legend">
          <span className="analogue">FM</span>
          <span className="digital">DMR</span>
          <span className="other">Other</span>
        </div>

        <Text size="sm" c="dimmed">
          {statsText.split(/(\d+)/).map((part, i) =>
            /^\d+$/.test(part) ? (
              <Text key={i} span fw={600} c="inherit">
                {part}
              </Text>
            ) : (
              part
            ),
          )}
        </Text>

        {skipped.length > 0 ? (
          <>
            <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={toggleSkipped}>
              Skipped channels {skippedOpen ? '▾' : '▸'}
            </Text>
            <Collapse expanded={skippedOpen}>
              <ul className="channel-map-skipped">
                {displayedSkipped.map((s) => (
                  <li key={`${s.name}-${s.reason}`}>
                    {s.name} — {s.reason}
                  </li>
                ))}
                {skipped.length > 200 ? <li>… and {skipped.length - 200} more</li> : null}
              </ul>
            </Collapse>
          </>
        ) : null}

        {zones.length > 0 ? (
          <>
            <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={toggleZones}>
              Zones {zonesOpen ? '▾' : '▸'}
            </Text>
            <Collapse expanded={zonesOpen}>
              <ul className="channel-map-zones">
                {zoneHulls.map((zh) => (
                  <li
                    key={zh.zone.name}
                    className={zh.missing.length || zh.geometry === 'none' ? 'warn' : 'ok'}
                  >
                    {zh.zone.name} — {zh.shapeNote}
                    {zh.missing.length ? `, ${zh.missing.length} skipped` : ''}
                  </li>
                ))}
              </ul>
            </Collapse>
          </>
        ) : null}
      </aside>

      <div className="channel-map-map">
        {mapLayoutReady ? (
          <MapContainer center={[56.5, -4.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <MapResizeFix />
            <TileLayer
              key={`${tileProvider}-${mapboxToken}`}
              url={tileConfig.config.url}
              attribution={tileConfig.config.attribution}
              maxZoom={tileConfig.config.maxZoom}
              {...(tileConfig.config.tileSize != null
                ? {
                    tileSize: tileConfig.config.tileSize,
                    zoomOffset: tileConfig.config.zoomOffset ?? -1,
                  }
                : {})}
            />

            {showZoneHulls
              ? zoneHulls.map((zh) => {
                  if (zh.geometry === 'none') return null;
                  const popupContent = (
                    <div>
                      <strong>{zh.zone.name}</strong>
                      <br />
                      {zh.zone.members.length} zone members · {zh.shapeNote}
                      {zh.missing.length ? (
                        <>
                          <br />
                          <span style={{ opacity: 0.75 }}>
                            {zh.missing.length} member(s) without coords
                          </span>
                        </>
                      ) : null}
                    </div>
                  );

                  if (zh.geometry === 'circle') {
                    return (
                      <Circle
                        key={zh.zone.name}
                        center={zh.points[0]}
                        radius={2500}
                        pathOptions={{
                          color: zh.colors.stroke,
                          fillColor: zh.colors.stroke,
                          fillOpacity: 0.18,
                          weight: 2,
                        }}
                      >
                        <Tooltip sticky direction="center" className="zone-tooltip">
                          {zh.zone.name}
                        </Tooltip>
                        <Popup>{popupContent}</Popup>
                      </Circle>
                    );
                  }

                  if (zh.geometry === 'line') {
                    return (
                      <Polyline
                        key={zh.zone.name}
                        positions={zh.points}
                        pathOptions={{ color: zh.colors.stroke, weight: 3, opacity: 0.85 }}
                      >
                        <Tooltip sticky direction="center" className="zone-tooltip">
                          {zh.zone.name}
                        </Tooltip>
                        <Popup>{popupContent}</Popup>
                      </Polyline>
                    );
                  }

                  return (
                    <Polygon
                      key={zh.zone.name}
                      positions={zh.hull!}
                      pathOptions={{
                        color: zh.colors.stroke,
                        fillColor: zh.colors.stroke,
                        fillOpacity: 0.18,
                        weight: 2,
                      }}
                    >
                      <Tooltip sticky direction="center" className="zone-tooltip">
                        {zh.zone.name}
                      </Tooltip>
                      <Popup>{popupContent}</Popup>
                    </Polygon>
                  );
                })
              : null}

            {groups.map((group) => {
              const ch = group[0];
              const merged = group.length > 1;
              const color = markerColor(merged ? dominantType(group) : ch.type);
              const label = markerLabel(group, fullChannelName);
              const position: LatLon = [ch.lat!, ch.lon!];

              return (
                <Marker
                  key={`${position[0]}-${position[1]}-${ch.name}`}
                  position={position}
                  icon={channelDivIcon(color, label, merged)}
                >
                  <Popup>
                    <ChannelPopup group={group} />
                  </Popup>
                </Marker>
              );
            })}

            {groups.length > 0 ? (
              <FitMapBounds groups={groups} zoneHulls={zoneHulls} showZoneHulls={showZoneHulls} />
            ) : null}
          </MapContainer>
        ) : null}
      </div>
    </div>
  );
}

export { CHANNEL_COLORS };
