# Channels layer

Channel markers and popups — how `Channels.csv` becomes points on the map.

See the [map hub](README.md) for overall data flow and load order.

## Purpose

Documents filtering, grouping, and rendering of channels from the central codeplug store. Zone hulls reuse the same filtered channel set via id lookup; see [zones.md](zones.md) for zone-specific behaviour. CSV parsing lives in [import docs](../import/README.md); entity shapes in [data model](../data-model/README.md).

## Code anchors

| Symbol / region | File | Role |
| --- | --- | --- |
| `parseChannels` | `src/lib/import/opengd77/parse.ts` | OpenGD77 Channels.csv → `Channel[]` |
| `parseCsv` | `src/lib/csv.ts` | RFC-style CSV parser (quoted fields, BOM strip) |
| `applyFilters` | `src/lib/channels.ts` | Plot vs skip by coordinates and `Use Location` |
| `groupByCoords` | same | Optional merge at identical lat/lon |
| `buildChannelById` | same | Plotted channels indexed by internal `id` |
| Import | Home page `ImportDropzone` only (not on map sidebar) |
| `useCodeplug` | `src/state/codeplugStore.tsx` | Central codeplug state |
| Marker rendering | `src/components/ChannelMap/ChannelMap.tsx` | react-leaflet `divIcon` markers + popups |

## Inputs — `Channels.csv`

Columns are matched by **header name**, not column index.

### Required

| Column | Used for |
| --- | --- |
| `Channel Name` | Identity, labels, zone FK lookup |
| `Latitude` | Marker position (`parseFloat`; non-finite → treated as missing) |
| `Longitude` | Marker position |

### Optional (parsed when present)

| Column | Used for |
| --- | --- |
| `Channel Number` | Stored; not shown on map |
| `Channel Type` | Marker colour — mapped to specific mode; see [channel-modes](../../reference/channel-modes.md) |
| `Rx Frequency` | Popup |
| `Tx Frequency` | Popup |
| `Contact` | Popup (DMR; hidden when `None`) |
| `TG List` | Popup (DMR; hidden when `None`) |
| `Use Location` | Filter — `Yes` (case-insensitive) enables plotting when filter is on |

Tab characters inside cell values are stripped after trim.

### Parsed channel object (in memory)

See [data model — Channel](../data-model/README.md#channel). Example:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "number": "42",
  "name": "GB3CS Motherwell",
  "callsign": "GB3CS",
  "mode": "fm",
  "rxFrequency": "430.92500",
  "txFrequency": "438.52500",
  "contactName": "None",
  "rxGroupListName": "None",
  "location": { "lat": 55.78, "lon": -4.10 },
  "useLocation": true
}
```

`callsign` is the first whitespace-separated token of `name` (`extractCallsign`).

## UI controls

Controls are Mantine inputs bound to React state in `ChannelMap.tsx` (no DOM ids). Import is on the home page only; the map reads the active project's codeplug.

| Control | State / hook | Default | Effect |
| --- | --- | --- | --- |
| Import panel | `useCodeplug()` | — | Loads Channels.csv and/or Zones.csv via import layer |
| Only `Use Location = Yes` | `requireUseLocation` | on | Skips channels where CPS marked `Use Location` not `Yes` |
| Skip 0,0 coordinates | `skipZero` | on | Skips channels at exactly `0, 0` |
| Merge markers at same lat/lon | `dedupeCoords` | on | One marker per site; popup lists all co-located channels |
| Label with full channel name | `fullChannelName` | off | Label uses full `Channel Name`; default is callsign (first word) |

Changing any filter updates state; markers and zone hulls recompute reactively via `useMemo` (no imperative refresh call).

## Behaviour

### Plot vs skip

A channel is **skipped** when:

1. `location` is null or missing finite lat/lon, or
2. **Skip 0,0** is on and both coordinates are exactly `0`, or
3. **Only Use Location = Yes** is on and `useLocation` is false.

Skipped channels appear in the **Skipped channels** sidebar list (up to 200 rows, then “… and N more”). Stats line shows plotted count, marker count, total in file, and skipped count.

### Marker appearance

Per-mode marker colours are defined in [channel-modes](../../reference/channel-modes.md) (`src/lib/channelModes.ts`). Examples: `fm` `#f0c419`, `dmr` `#e03131`, `dstar` `#7950f2`.

Merged groups use the **dominant** mode: the most frequent specific mode in the co-located group (tie → first channel).

Markers use a `divIcon` with a dot and permanent label below. Merged sites use a slightly larger dot and a `+N` suffix on the label.

### Popups

Click a marker for:

- Title: callsign, or `callsign (+N)` when merged
- Per channel: full name, mode label, RX/TX MHz, and for DMR rows contact / TG list when not `None`

### Map bounds

The `FitMapBounds` child component (via `useMap`) fits the view to **both** marker and zone-hull points whenever they change. Points are gathered by `collectMapPoints` and the view is computed by `computeMapView` (`src/lib/mapView.ts`) with padding `[48, 48]` and `maxZoom: 11`; degenerate single-point bounds use `setView` at zoom `11` to avoid an infinite tile load.

Initial map centre: `[56.5, -4.0]`, zoom `6` (before first load).

## Browser storage

| Key | Purpose |
| --- | --- |
| `mm9pdy-codeplug-tool.channel-map.mapboxToken` | Mapbox access token (optional) |
| `mm9pdy-codeplug-tool.channel-map.tileProvider` | `osm` / `mapbox` / `mapbox-sat` |

Channel CSV content persists via the **codeplug projects store** in LocalStorage ([#9](https://github.com/pskillen/codeplug-tool/issues/9)) — see [persistence/](../persistence/README.md). The map reads the **active** project's codeplug. Map tile prefs use separate keys below.

## Manual verify

1. Copy `Channels.csv` from an OpenGD77 export into `sample-exports/`.
2. Run `npm run dev` and open `http://localhost:5173/codeplug-tool/#/channels` (or the [live site](https://pskillen.github.io/codeplug-tool/#/channels)).
3. **Home:** import `Channels.csv` to create a new project, or **Import & export:** import into the active codeplug (merge/overwrite).
4. Confirm markers appear on the channels map for known repeaters; open popups for frequency/contact fields.
5. Toggle **Skip 0,0** and **Use Location** — skipped list and marker count should update.
6. Toggle **Merge same lat/lon** — co-located FM/DMR pairs should collapse to one marker when enabled.
7. Import `Zones.csv` via Import & export (merge) — hulls should respect the same filters (see [zones.md](zones.md)).

## Known gaps

- No support for semicolon-delimited CPS exports (comma only in `parseCsv`).
- Channel names must match zone references exactly at the import boundary — no fuzzy or callsign-only fallback.
- No editing or write-back to CSV.
- Delimiter/tab quirks in OpenGD77 exports beyond simple tab strip are not normalised.

## Related

- [zones.md](zones.md) — zone hulls and `Zones.csv`
- [import README](../import/README.md) — CSV import and adapters
- [data model](../data-model/README.md) — internal entities
- [map README](README.md) — hub and status table
