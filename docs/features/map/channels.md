# Channels layer

Channel markers and popups — how `Channels.csv` becomes points on the map.

See the [map hub](README.md) for overall data flow and load order.

## Purpose

Documents parsing, filtering, grouping, and rendering of OpenGD77 channel rows. Zone hulls reuse the same filtered channel set via `channelIndex`; see [zones.md](zones.md) for zone-specific behaviour.

## Code anchors

| Symbol / region | File | Role |
| --- | --- | --- |
| `COL` (header names) | `src/lib/csv.ts` | Header names for channel columns |
| `parseCsv` | same | RFC-style CSV parser (quoted fields, BOM strip) |
| `parseChannelsCsv` | same | Build channel objects from rows |
| `applyFilters` | `src/lib/channels.ts` | Plot vs skip by coordinates and `Use Location` |
| `groupByCoords` | same | Optional merge at identical lat/lon |
| Marker rendering | `src/components/ChannelMap/ChannelMap.tsx` | react-leaflet `divIcon` markers + popups |
| Map refresh | `ChannelMap.tsx` (useMemo) | Rebuild index, markers, then zone hulls |

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
| `Channel Type` | Marker colour (`Analogue` / `Digital` / other) |
| `Rx Frequency` | Popup |
| `Tx Frequency` | Popup |
| `Contact` | Popup (digital; hidden when `None`) |
| `TG List` | Popup (digital; hidden when `None`) |
| `Use Location` | Filter — `Yes` (case-insensitive) enables plotting when filter is on |

Tab characters inside cell values are stripped after trim.

### Parsed channel object (in memory)

```json
{
  "number": "42",
  "name": "GB3CS Motherwell",
  "callsign": "GB3CS",
  "type": "Analogue",
  "rx": "430.92500",
  "tx": "438.52500",
  "contact": "None",
  "tgList": "None",
  "lat": 55.78,
  "lon": -4.10,
  "useLocation": true
}
```

`callsign` is the first whitespace-separated token of `Channel Name` (`extractCallsign`).

## UI controls

Controls are Mantine inputs bound to React state in `ChannelMap.tsx` (no DOM ids).

| Control label | State | Default | Effect |
| --- | --- | --- | --- |
| Channels file dropzone | `channels` (via `loadChannelsFile`) | — | Loads and parses `Channels.csv` |
| Only `Use Location = Yes` | `requireUseLocation` | on | Skips channels where CPS marked `Use Location` not `Yes` |
| Skip 0,0 coordinates | `skipZero` | on | Skips channels at exactly `0, 0` |
| Merge markers at same lat/lon | `dedupeCoords` | on | One marker per site; popup lists all co-located channels |
| Label with full channel name | `fullChannelName` | off | Label uses full `Channel Name`; default is callsign (first word) |

Changing any filter updates state; markers and zone hulls recompute reactively via `useMemo` (no imperative refresh call).

## Behaviour

### Plot vs skip

A channel is **skipped** when:

1. `lat` or `lon` is missing or not a finite number, or
2. **Skip 0,0** is on and both coordinates are exactly `0`, or
3. **Only Use Location = Yes** is on and `useLocation` is false.

Skipped channels appear in the **Skipped channels** sidebar list (up to 200 rows, then “… and N more”). Stats line shows plotted count, marker count, total in file, and skipped count.

### Marker appearance

| `Channel Type` | Colour | CSS variable |
| --- | --- | --- |
| `Analogue` / `Analog` | Yellow | `--analogue` `#f0c419` |
| `Digital` | Red | `--digital` `#e03131` |
| Other / empty | Purple | `--other` `#9c36b5` |

Merged groups use the **dominant** type: digital if at least half the co-located channels are `Digital`.

Markers use a `divIcon` with a dot and permanent label below. Merged sites use a slightly larger dot and a `+N` suffix on the label.

### Popups

Click a marker for:

- Title: callsign, or `callsign (+N)` when merged
- Per channel: full name, type, RX/TX MHz, and for digital rows contact / TG list when not `None`

### Map bounds

The `FitMapBounds` child component (via `useMap`) fits the view to **both** marker and zone-hull points whenever they change. Points are gathered by `collectMapPoints` and the view is computed by `computeMapView` (`src/lib/mapView.ts`) with padding `[48, 48]` and `maxZoom: 11`; degenerate single-point bounds use `setView` at zoom `11` to avoid an infinite tile load.

Initial map centre: `[56.5, -4.0]`, zoom `6` (before first load).

## Browser storage

| Key | Purpose |
| --- | --- |
| `opengd77-channel-map.mapboxToken` | Mapbox access token (optional) |
| `opengd77-channel-map.tileProvider` | `osm` / `mapbox` / `mapbox-sat` |

Channel CSV content is **not** persisted — reload the file after a page refresh.

## Manual verify

1. Copy `Channels.csv` from an OpenGD77 export into `sample-exports/`.
2. Run `npm run dev` and open `http://localhost:5173/codeplug-tool/#/map` (or the [live site](https://pskillen.github.io/codeplug-tool/#/map)).
3. Load `Channels.csv` via dropzone or file picker.
4. Confirm markers appear for known repeaters; open popups for frequency/contact fields.
5. Toggle **Skip 0,0** and **Use Location** — skipped list and marker count should update.
6. Toggle **Merge same lat/lon** — co-located FM/DMR pairs should collapse to one marker when enabled.
7. Load `Zones.csv` (see [zones.md](zones.md)) — hulls should respect the same filters.

## Known gaps

- No support for semicolon-delimited CPS exports (comma only in `parseCsv`).
- Channel names must match zone references exactly — no fuzzy or callsign-only fallback.
- No editing or write-back to CSV.
- Delimiter/tab quirks in OpenGD77 exports beyond simple tab strip are not normalised.

## Related

- [zones.md](zones.md) — zone hulls and `Zones.csv`
- [map README](README.md) — hub and status table
