# Channels layer

Channel markers and popups — how `Channel` entities from the codeplug become points on the map.

See the [map hub](README.md) for overall data flow and shared concepts.

## Purpose

Documents filtering, grouping, and rendering of channels from the central codeplug store. The map consumes the **internal data model** only — it never parses CSV. Importing CSV into the model is the [import/export](../import-export/README.md) surface's job; entity shapes are in the [data model](../data-model/README.md). Zone hulls reuse the same filtered channel set via id lookup; see [zones.md](zones.md).

## Code anchors

| Symbol / region | File | Role |
| --- | --- | --- |
| `useCodeplug` | `src/state/codeplugStore.tsx` | Active project's codeplug (`Channel[]`, `Zone[]`) |
| `applyFilters` | `src/lib/channels.ts` | Plot vs skip by `location`, `useLocation`, `hideFromMap` |
| `groupByCoords` | same | Optional merge of channels at identical lat/lon |
| `buildChannelById` | same | Plotted channels indexed by internal `id` |
| `markerColor` / `markerLabel` / `dominantMode` | same | Per-mode colour, label text, merged-group mode |
| `CodeplugMap` | `src/components/CodeplugMap/CodeplugMap.tsx` | react-leaflet `divIcon` markers + popups |

## Inputs — the `Channel` model

The map receives `Channel[]` as props (sourced from the active project's codeplug), not files. Only the model fields below affect the map; see [data model — Channel](../data-model/README.md#channel) for the full shape.

| Field | Type | Used for |
| --- | --- | --- |
| `id` | `string` | Marker index (`buildChannelById`), highlight target |
| `name` | `string` | Label (full-name mode), popup title, zone member resolution |
| `callsign` | `string` | Label (default mode) — first word of `name` |
| `mode` | `ChannelMode` | Marker colour; see [channel-modes](../../reference/channel-modes.md) |
| `location` | `GeoPoint \| null` | Marker position; `null` → skipped |
| `useLocation` | `boolean` | Plot filter — when the filter is on, `false` is skipped |
| `hideFromMap` | `boolean` | Internal flag — always skipped from markers and hulls |
| `rxFrequency` / `txFrequency` | `string` | Popup |
| `contactName` / `rxGroupListName` | `string` | Popup (DMR; hidden when empty or `None`) |

How vendor CSV columns (`Channel Name`, `Latitude`, `Use Location`, …) map onto these fields is documented at the [OpenGD77 import surface](../import-export/opengd77/README.md), not here.

## UI controls

Controls are Mantine inputs in [`MapControls`](../../../src/components/CodeplugMap/MapControls.md) bound to React state in `CodeplugMap.tsx` (no DOM ids). The map reads the active project's codeplug; importing happens elsewhere.

| Control | State / hook | Default | Effect |
| --- | --- | --- | --- |
| Only `Use Location = Yes` | `requireUseLocation` | on | Skips channels whose `useLocation` is false |
| Skip 0,0 coordinates | `skipZero` | on | Skips channels at exactly `0, 0` |
| Merge markers at same lat/lon | `dedupeCoords` | on | One marker per site; popup lists all co-located channels |
| Label with full channel name | `fullChannelName` | off | Label uses full `name`; default is `callsign` |

When embedded in report pages, `CodeplugMap` applies these as fixed filters rather than exposing every checkbox — see [CodeplugMap.md](../../../src/components/CodeplugMap/CodeplugMap.md). Changing any filter recomputes markers and zone hulls reactively via `useMemo` (no imperative refresh call).

## Behaviour

### Plot vs skip

`applyFilters` skips a channel when:

1. `location` is `null`, or
2. **Skip 0,0** is on and both coordinates are exactly `0`, or
3. **Only Use Location = Yes** is on and `useLocation` is false, or
4. `hideFromMap` is true (always).

Skipped channels appear in the **Skipped channels** sidebar list (up to 200 rows, then "… and N more") with the skip reason. The stats line shows plotted count, marker count, total, and skipped count.

### Marker appearance

Per-mode marker colours are defined in [channel-modes](../../reference/channel-modes.md) (`src/lib/channelModes.ts`). Examples: `fm` `#f0c419`, `dmr` `#e03131`, `dstar` `#7950f2`.

Merged groups use the **dominant** mode: the most frequent specific mode in the co-located group (tie → first channel).

Markers use a `divIcon` with a dot and permanent label below. Merged sites use a slightly larger dot and a `+N` suffix on the label.

### Popups

Click a marker for:

- Title: callsign, or `callsign (+N)` when merged
- Per channel: full name, mode label, RX/TX MHz, and for DMR rows contact / TG list when set

### Map bounds

The `FitMapBounds` child component (via `useMap`) fits the view to **both** marker and zone-hull points whenever they change. Points are gathered by `collectMapPoints` and the view is computed by `computeMapView` (`src/lib/mapView.ts`) with padding `[48, 48]` and `maxZoom: 11`; degenerate single-point bounds use `setView` at zoom `11` to avoid an infinite tile load.

Initial map centre: `[56.5, -4.0]`, zoom `6` (before first load).

## Browser storage

| Key | Purpose |
| --- | --- |
| `mm9pdy-codeplug-tool.channel-map.mapboxToken` | Mapbox access token (optional) |
| `mm9pdy-codeplug-tool.channel-map.tileProvider` | `osm` / `mapbox` / `mapbox-sat` |

Channel data persists via the **codeplug projects store** in LocalStorage ([#9](https://github.com/pskillen/codeplug-tool/issues/9)) — see [persistence/](../persistence/README.md). The map reads the **active** project's codeplug. Map tile prefs use the separate keys above.

## Manual verify

1. Import an OpenGD77 export (or create channels) so the active project has geolocated channels.
2. Run `npm run dev` and open `http://localhost:5173/codeplug-tool/#/channels` (or the [live site](https://pskillen.github.io/codeplug-tool/#/channels)).
3. Confirm markers appear for known repeaters; open popups for frequency/contact fields.
4. Toggle **Skip 0,0** and **Use Location** — skipped list and marker count should update.
5. Toggle **Merge same lat/lon** — co-located FM/DMR pairs should collapse to one marker when enabled.
6. With zones present, confirm hulls respect the same filters (see [zones.md](zones.md)).

## Known gaps

- A channel resolves to a marker only via its own `location`; there is no geocoding from callsign or name.
- Map is read-only — editing channels happens on the channel CRUD routes, not the map.

## Related

- [zones.md](zones.md) — zone hulls
- [CodeplugMap.md](../../../src/components/CodeplugMap/CodeplugMap.md) — component props and embedding
- [import/export README](../import-export/README.md) — CSV parsing into the model
- [data model](../data-model/README.md) — internal entities
- [map README](README.md) — hub and status table
