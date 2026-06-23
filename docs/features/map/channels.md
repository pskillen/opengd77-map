# Channels layer

Channel markers and popups — how `Channel` records from the active codeplug become points on the map.

See the [map hub](README.md) for overall data flow. This layer reads the **internal model** ([`Channel`](../data-model/README.md#channel)); CSV parsing belongs to the [import/export surface](../import-export/README.md), not here.

## Purpose

Documents filtering, grouping, and rendering of channels from the central codeplug store. Zone hulls reuse the same plotted channel set via id lookup; see [zones.md](zones.md) for zone-specific behaviour. Entity shapes are in the [data model](../data-model/README.md).

## Code anchors

| Symbol / region | File | Role |
| --- | --- | --- |
| `applyFilters` | `src/lib/channels.ts` | Plot vs skip a `Channel[]` by coordinates, `useLocation`, `hideFromMap` |
| `groupByCoords` | same | Optional merge of channels at identical lat/lon |
| `buildChannelById` | same | Plotted channels indexed by internal `id` |
| `markerColor` / `markerLabel` / `dominantMode` | same | Per-marker colour, label, and merged-group mode |
| `useCodeplug` | `src/state/codeplugStore.tsx` | Central codeplug state (active project) |
| Marker rendering | `src/components/CodeplugMap/CodeplugMap.tsx` | react-leaflet `divIcon` markers + popups ([sidecar](../../../src/components/CodeplugMap/CodeplugMap.md)) |

The map is given `Channel[]` as a prop; it never reads CSV. A codeplug enters the store via the import layer (home page or Import & export panel) — see [import/export](../import-export/README.md).

## Inputs — the `Channel` model

The map consumes these [`Channel`](../data-model/README.md#channel) fields:

| Field | Used for |
| --- | --- |
| `name` | Popup title source, full-name label, zone member resolution |
| `callsign` | Default marker label (derived first word of `name`) |
| `location` (`{ lat, lon } \| null`) | Marker position; `null` → skipped |
| `useLocation` | Filter — `false` excludes the channel when the Use-Location filter is on |
| `hideFromMap` | Internal flag — always excludes the channel from markers and hulls |
| `mode` | Marker colour and popup mode label; see [channel-modes](../../reference/channel-modes.md) |
| `multiMode`, `modeProfiles` | One marker per logical channel; label shows combined modes (e.g. `GB7GL FM+DMR`) — see [multi-mode](../../reference/opengd77/multi-mode.md) |
| `rxFrequency`, `txFrequency` | Popup RX/TX MHz line |
| `contactName`, `rxGroupListName` | Popup DMR rows (hidden when empty or `None`) |

`callsign` is derived at import as the first whitespace-separated token of `name` (`extractCallsign`); the map treats it as a plain model field.

### Channel record (in memory)

See [data model — Channel](../data-model/README.md#channel). Example of the fields this layer reads:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "GB3CS Motherwell",
  "callsign": "GB3CS",
  "mode": "fm",
  "rxFrequency": "430.92500",
  "txFrequency": "438.52500",
  "contactName": "None",
  "rxGroupListName": "None",
  "location": { "lat": 55.78, "lon": -4.10 },
  "useLocation": true,
  "hideFromMap": false
}
```

## Controls and filters

[`CodeplugMap`](../../../src/components/CodeplugMap/CodeplugMap.md) exposes two display toggles via [`MapControls`](../../../src/components/CodeplugMap/MapControls.md); the coordinate filters are **fixed**, not user-facing.

| Control / filter | Source | Default | Effect |
| --- | --- | --- | --- |
| Full channel name | `MapControls` toggle | off | Label uses full `name`; default is `callsign` |
| Draw zones | `MapControls` toggle | on | Show/hide zone hulls — see [zones.md](zones.md) |
| Require `useLocation` | fixed (`DEFAULT_FILTER_OPTS`) | on | Skips channels with `useLocation === false` |
| Skip `0,0` | fixed (`DEFAULT_FILTER_OPTS`) | on | Skips channels at exactly `0, 0` |
| Hide from map | `Channel.hideFromMap` | — | Always skips flagged channels |

Markers and zone hulls recompute reactively via `useMemo` when the channel list or toggles change (no imperative refresh).

## Behaviour

### Plot vs skip

`applyFilters` marks a channel **skipped** when:

1. `location` is `null`, or
2. **Skip 0,0** is on and both coordinates are exactly `0`, or
3. **Require useLocation** is on and `useLocation` is `false`, or
4. `hideFromMap` is `true`.

Each skip carries a reason (`missing coordinates`, `0,0 coordinates`, `Use Location = No`, `hidden from map`) for sidebar/report feedback. All other channels are plotted.

### Marker appearance

Per-mode marker colours are defined in [channel-modes](../../reference/channel-modes.md) (`src/lib/channelModes.ts`). Examples: `fm` `#f0c419`, `dmr` `#e03131`, `dstar` `#7950f2`.

Merged groups (channels at the same lat/lon to 5 decimal places) use the **dominant** mode: the most frequent specific mode in the co-located group (tie → first channel).

**Multi-mode channels** (`multiMode: true`) always plot as **one marker** per logical channel (not per export-expanded row). The label appends combined mode names (e.g. `GB7GL FM+DMR`). Marker colour uses the channel's primary `mode` field.

Markers use a `divIcon` with a dot and permanent label below. Merged sites use a slightly larger dot and a `+N` suffix on the label. `highlightChannelId` emphasises one marker on detail pages.

### Popups

Click a marker for:

- Title: callsign, or `callsign (+N)` when merged
- Per channel: full `name`, mode label, RX/TX MHz, and for DMR rows `contactName` / `rxGroupListName` when not empty or `None`

### Map bounds

`FitMapBounds` (via `useMap`) fits the view to marker, zone-hull, and operator points whenever they change. Points are gathered by `collectMapPoints` and the view computed by `computeMapView` (`src/lib/mapView.ts`) with padding `[48, 48]` and `maxZoom: 11`; degenerate single-point bounds use `setView` at zoom `11` to avoid an infinite tile load.

Initial map centre: `[56.5, -4.0]`, zoom `6` (before any channels plot).

## Browser storage

| Key | Purpose |
| --- | --- |
| `mm9pdy-codeplug-tool.channel-map.mapboxToken` | Mapbox access token (optional) |
| `mm9pdy-codeplug-tool.channel-map.tileProvider` | `osm` / `mapbox` / `mapbox-sat` |

The codeplug itself persists via the **projects store** in LocalStorage ([#9](https://github.com/pskillen/codeplug-tool/issues/9)) — see [persistence/](../persistence/README.md). The map reads the **active** project's codeplug. Tile preferences use the separate keys above.

## Manual verify

1. Create or open a project with geolocated channels (import a codeplug on the home page — OpenGD77 CSV is the importer shipped today — or use an existing project).
2. Run `npm run dev` and open `http://localhost:5173/codeplug-tool/#/channels` (or the [live site](https://pskillen.github.io/codeplug-tool/#/channels)).
3. Confirm markers appear for known repeaters; open popups for frequency/contact fields.
4. Edit a channel's location or toggle **Hide from map** — the marker should appear/disappear on save.
5. Toggle **Full channel name** — labels switch between callsign and full name.
6. Co-located FM/DMR pairs should collapse to one merged marker with a combined popup.

## Known gaps

- Coordinate filters (`useLocation`, skip `0,0`) are fixed on embedded maps — not user-adjustable per page.
- Zone member resolution is exact-match on channel `name` (case-sensitive) — no fuzzy or callsign-only fallback.
- No legend mapping mode → colour beyond the reference table.

## Related

- [zones.md](zones.md) — zone hulls from the `Zone` model
- [data model — Channel](../data-model/README.md#channel) — internal entity
- [import/export README](../import-export/README.md) — where an imported format becomes the model
- [map README](README.md) — hub and status table
