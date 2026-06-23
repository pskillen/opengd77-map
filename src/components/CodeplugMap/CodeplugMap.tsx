import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
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
  useMapEvents,
} from 'react-leaflet';
import {
  applyFilters,
  buildChannelById,
  dominantMode,
  groupByCoords,
  markerColor,
  markerLabel,
  zoneGeolocatedPoints,
  type FilterOptions,
} from '../../lib/channels.ts';
import { getMemberWireNames } from '../../lib/entityProvenance.ts';
import { entityRefDisplayName } from '../../lib/entityRefs.ts';
import { formatFrequencyHz } from '../../lib/formatFrequency.ts';
import { isDmrMode } from '../../lib/channelModes.ts';
import { channelModeSummary } from '../../lib/channels.ts';
import { convexHullLatLon, zoneColor, type LatLon } from '../../lib/geo.ts';
import { collectMapPoints, computeMapView } from '../../lib/mapView.ts';
import type { Channel, Contact, RxGroupList, TalkGroup, Zone } from '../../models/codeplug.ts';
import { useDocumentLayoutReady } from '../../hooks/useDocumentLayoutReady.ts';
import { useMapSettings } from '../../hooks/useMapSettings.ts';
import MapControls from './MapControls.tsx';
import MaidenheadGridLayer from './MaidenheadGridLayer.tsx';
import './CodeplugMap.css';

const DEFAULT_FILTER_OPTS: FilterOptions = {
  requireUseLocation: true,
  skipZero: true,
};

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

function channelDivIcon(
  color: string,
  label: string,
  merged: boolean,
  highlighted: boolean,
): L.DivIcon {
  return L.divIcon({
    className: 'channel-marker-wrap',
    html: `<div class="channel-marker">
      <div class="channel-marker-dot${merged ? ' merged' : ''}${highlighted ? ' highlighted' : ''}" style="background:${color}"></div>
      <div class="channel-marker-label">${escapeHtml(label)}</div>
    </div>`,
    iconAnchor: [0, 0],
  });
}

function operatorDivIcon(): L.DivIcon {
  return L.divIcon({
    className: 'operator-marker-wrap',
    html: `<div class="operator-marker">
      <div class="operator-marker-dot"></div>
      <div class="operator-marker-label">You</div>
    </div>`,
    iconAnchor: [0, 0],
  });
}

function ChannelPopup({
  group,
  talkGroups,
  contacts,
  rxGroupLists,
}: {
  group: Channel[];
  talkGroups: TalkGroup[];
  contacts: Contact[];
  rxGroupLists: RxGroupList[];
}) {
  const title =
    group.length === 1 ? group[0].callsign : `${group[0].callsign} (+${group.length - 1})`;

  return (
    <div style={{ minWidth: 180, maxWidth: 280 }}>
      <strong>{title}</strong>
      {group.map((ch) => {
        const freq =
          ch.rxFrequency && ch.txFrequency
            ? `${formatFrequencyHz(ch.rxFrequency).replace(' MHz', '')} / ${formatFrequencyHz(ch.txFrequency).replace(' MHz', '')} MHz`
            : '';
        const dmr = isDmrMode(ch.mode)
          ? [
              (() => {
                const label = entityRefDisplayName(ch.contactRef, talkGroups, contacts);
                return label ? `TX: ${label}` : null;
              })(),
              (() => {
                if (!ch.rxGroupListId) return null;
                const list = rxGroupLists.find((r) => r.id === ch.rxGroupListId);
                return list ? `RX list: ${list.name}` : null;
              })(),
            ]
              .filter(Boolean)
              .join(' · ')
          : '';
        return (
          <div key={ch.id} style={{ marginBottom: '0.5rem' }}>
            <strong>{ch.name}</strong>
            <br />
            <span style={{ opacity: 0.85 }}>
              {channelModeSummary(ch)}
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
  operatorPosition,
}: {
  groups: Channel[][];
  zoneHulls: ZoneHullData[];
  showZoneHulls: boolean;
  operatorPosition?: { lat: number; lon: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const zonePoints = showZoneHulls ? zoneHulls.flatMap((zh) => zh.points) : [];
    const extraPoints: LatLon[] =
      operatorPosition != null &&
      Number.isFinite(operatorPosition.lat) &&
      Number.isFinite(operatorPosition.lon)
        ? [[operatorPosition.lat, operatorPosition.lon]]
        : [];
    const points = collectMapPoints(groups, zonePoints, showZoneHulls, extraPoints);
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
  }, [map, groups, zoneHulls, showZoneHulls, operatorPosition]);

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

function MapClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface CodeplugMapProps {
  channels: Channel[];
  zones?: Zone[];
  allChannels?: Channel[];
  talkGroups?: TalkGroup[];
  contacts?: Contact[];
  rxGroupLists?: RxGroupList[];
  height?: number | string;
  showControls?: boolean;
  defaultFullChannelName?: boolean;
  defaultShowZones?: boolean;
  highlightChannelId?: string;
  compactMode?: boolean;
  onLocationPick?: (lat: number, lon: number) => void;
  operatorPosition?: { lat: number; lon: number } | null;
}

export default function CodeplugMap({
  channels,
  zones = [],
  allChannels,
  talkGroups = [],
  contacts = [],
  rxGroupLists = [],
  height = 400,
  showControls = true,
  defaultFullChannelName = false,
  defaultShowZones = true,
  highlightChannelId,
  compactMode = false,
  onLocationPick,
  operatorPosition = null,
}: CodeplugMapProps) {
  const mapLayoutReady = useDocumentLayoutReady();
  const { tileProvider, mapboxToken, tileConfig, maidenheadGrid } = useMapSettings();
  const [fullChannelName, setFullChannelName] = useState(defaultFullChannelName);
  const [showZoneHulls, setShowZoneHulls] = useState(defaultShowZones);

  const channelPool = allChannels ?? channels;
  const filterOpts = DEFAULT_FILTER_OPTS;

  const { plotted } = useMemo(() => applyFilters(channels, filterOpts), [channels, filterOpts]);

  const plottedById = useMemo(() => buildChannelById(plotted), [plotted]);

  const groups = useMemo(() => groupByCoords(plotted, true), [plotted]);

  const zoneHulls: ZoneHullData[] = useMemo(() => {
    if (!zones.length || !showZoneHulls || !plottedById.size) return [];

    return zones.map((zone, index) => {
      const { points, missing } = zoneGeolocatedPoints(zone, plottedById, channelPool, filterOpts);
      const colors = zoneColor(index);

      if (points.length === 0) {
        return {
          zone,
          index,
          points,
          missing,
          colors,
          shapeNote: `no geolocated members (${getMemberWireNames(zone).length} in zone)`,
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
  }, [zones, showZoneHulls, plottedById, channelPool, filterOpts]);

  const mapStyle = typeof height === 'number' ? { height: `${height}px` } : { height };

  return (
    <div className="codeplug-map-wrap">
      {showControls ? (
        <MapControls
          fullChannelName={fullChannelName}
          onFullChannelNameChange={setFullChannelName}
          showZones={showZoneHulls}
          onShowZonesChange={setShowZoneHulls}
          compactMode={compactMode}
        />
      ) : null}

      <div className="codeplug-map" style={mapStyle}>
        {mapLayoutReady ? (
          <MapContainer
            center={[56.5, -4.0]}
            zoom={6}
            preferCanvas
            style={{ height: '100%', width: '100%' }}
          >
            <MapResizeFix />
            {onLocationPick ? <MapClickHandler onPick={onLocationPick} /> : null}
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

            <MaidenheadGridLayer mode={maidenheadGrid} />

            {showZoneHulls
              ? zoneHulls.map((zh) => {
                  if (zh.geometry === 'none') return null;
                  const popupContent = (
                    <div>
                      <strong>{zh.zone.name}</strong>
                      <br />
                      {getMemberWireNames(zh.zone).length} zone members · {zh.shapeNote}
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
                        key={zh.zone.id}
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
                        key={zh.zone.id}
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
                      key={zh.zone.id}
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
              const color = markerColor(merged ? dominantMode(group) : ch.mode);
              const label = markerLabel(group, fullChannelName);
              const position: LatLon = [ch.location!.lat, ch.location!.lon];
              const highlighted =
                highlightChannelId != null && group.some((c) => c.id === highlightChannelId);

              return (
                <Marker
                  key={`${ch.id}-${position[0]}-${position[1]}`}
                  position={position}
                  icon={channelDivIcon(color, label, merged, highlighted)}
                >
                  <Popup>
                    <ChannelPopup
                      group={group}
                      talkGroups={talkGroups}
                      contacts={contacts}
                      rxGroupLists={rxGroupLists}
                    />
                  </Popup>
                </Marker>
              );
            })}

            {operatorPosition != null &&
            Number.isFinite(operatorPosition.lat) &&
            Number.isFinite(operatorPosition.lon) ? (
              <Marker
                key="operator-position"
                position={[operatorPosition.lat, operatorPosition.lon]}
                icon={operatorDivIcon()}
                zIndexOffset={1000}
              >
                <Popup>
                  <strong>You are here</strong>
                </Popup>
              </Marker>
            ) : null}

            {groups.length > 0 ||
            operatorPosition != null ||
            (showZoneHulls && zoneHulls.some((zh) => zh.geometry !== 'none')) ? (
              <FitMapBounds
                groups={groups}
                zoneHulls={zoneHulls}
                showZoneHulls={showZoneHulls}
                operatorPosition={operatorPosition}
              />
            ) : null}
          </MapContainer>
        ) : null}
      </div>
    </div>
  );
}
