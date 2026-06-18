# Zones layer

Convex hull overlays — how `Zones.csv` members become coloured shapes on the map.

See the [map hub](README.md) for load order and shared concepts. Channel filtering and `channelIndex` are defined in [channels.md](channels.md).

## Purpose

Documents zone CSV parsing, member resolution against plotted channels, hull geometry, and sidebar feedback. A channel may belong to **multiple zones**; each zone builds its hull independently from its own member list.

## Code anchors

| Symbol / region | File | Role |
| --- | --- | --- |
| `parseZonesCsv` | `src/lib/csv.ts` | Parse zone rows and `Channel1`…`ChannelN` columns |
| `zoneGeolocatedPoints` | `src/lib/channels.ts` | Resolve members → lat/lon with skip reasons |
| `uniqueLatLon` | `src/lib/geo.ts` | Dedupe sites to 5 decimal places |
| `convexHullLatLon` | same | Andrew's monotone chain on `[lat, lon]` |
| `zoneColor` | same | Distinct hue per zone index |
| Zone hull rendering | `src/components/ChannelMap/ChannelMap.tsx` | react-leaflet polygon / polyline / circle layers |
| Zones file load | `ChannelMap.tsx` | Requires channels loaded first |

## Inputs — `Zones.csv`

### Required

| Column | Used for |
| --- | --- |
| `Zone Name` | Tooltip, popup title, sidebar list |

### Member columns

Any header matching `/^Channel\d+$/i` (e.g. `Channel1` … `Channel80` in standard exports). Non-empty cell values are zone members in list order. Empty cells are ignored.

Member strings must match **`Channel Name` in `Channels.csv` exactly** (case-sensitive). They are looked up in `channelIndex`, which contains only **plotted** channels after `applyFilters` — not the raw CSV.

### Parsed zone object (in memory)

```json
{
  "name": "Glasgow",
  "members": ["Hotspot", "GB7GL Glasgow", "GB3GL Glasgow", "…"]
}
```

Duplicate member names within one zone are deduplicated while preserving first occurrence order (`seenNames` in `zoneGeolocatedPoints`).

## UI controls

Controls are Mantine inputs bound to React state in `ChannelMap.tsx` (no DOM ids).

| Control label | State | Default | Effect |
| --- | --- | --- | --- |
| Zones file dropzone | `zones` (via `loadZonesFile`) | — | Loads `Zones.csv` after channels |
| Draw zone convex hulls | `showZoneHulls` | on | When off, no hull layers render; the sidebar Zones list is also empty (it is derived from the computed `zoneHulls`) |

Shared coordinate filters (`requireUseLocation`, `skipZero`) apply to hull points the same way as markers — see [channels.md](channels.md).

If `Channels.csv` is not loaded, `loadZonesFile` shows an alert and does nothing.

## Behaviour

### Member resolution

For each zone member name:

| Condition | Result |
| --- | --- |
| Not in `channelIndex` | Skipped — reason `not in Channels.csv` (unplotted or missing channel) |
| Missing lat/lon | Skipped — `no coordinates` |
| `0, 0` with **Skip 0,0** on | Skipped — `0,0 coordinates` |
| `Use Location = No` with filter on | Skipped — `Use Location = No` |
| Otherwise | Point `[lat, lon]` added |

Distinct sites are deduplicated with `toFixed(5)` on lat and lon.

### Hull geometry

| Geolocated sites | Shape | react-leaflet | Parameters |
| --- | --- | --- | --- |
| 0 | None | — (geometry `none`) | Sidebar warning: “no geolocated members” |
| 1 | Circle | `<Circle>` | Radius **2500 m**, fill opacity 0.18, weight 2 |
| 2 | Line | `<Polyline>` | Weight 3, opacity 0.85 |
| ≥ 3 | Convex hull | `<Polygon>` | `convexHullLatLon`; fill opacity **0.18**, weight 2 |

Each zone's shape is precomputed into a `ZoneHullData` object (`geometry: 'circle' | 'line' | 'polygon' | 'none'`) in a `useMemo`, then rendered by the matching react-leaflet component.

The hull algorithm sorts by longitude then latitude and runs monotone-chain convex hull in lat/lon plane. This is a **planning aid**, not RF coverage — adequate for regional repeater layouts at UK latitudes.

### Colours

`zoneColor(index)` assigns hue `(index × 137.508) mod 360` for golden-angle spacing:

- Stroke: `hsla(hue, 70%, 38%, 0.9)`
- Fill uses stroke colour with polygon/circle `fillOpacity: 0.18`

Zone shapes are rendered before the channel markers in `ChannelMap.tsx`, so markers stay on top. Overlapping hulls from shared repeaters are expected and render transparently.

### Sidebar — Zones panel

The sidebar **Zones** panel — a Mantine `Text` toggle plus `Collapse` (state `zonesOpen`) — appears when zones are loaded. Each zone lists:

- **ok** — hull drawn; shows vertex/site counts and optional skipped member count
- **warn** — no geolocated members, or some members skipped (still draws hull if ≥1 site)

Popups include zone name, member count, shape note, and count of members without coords.

### Multi-zone channels

A channel in both `Glasgow` and `Edinburgh` zones contributes its coordinates to **both** hulls. There is no single “primary” zone on the map — overlap is intentional.

### Stats line

When zones are loaded, stats append `· **N** zones`.

## Browser storage

Zone CSV content is **not** persisted. Hull visibility follows the **Draw zone convex hulls** checkbox only (not stored in `localStorage`).

## Manual verify

1. Load `Channels.csv` then `Zones.csv` from the same export into the tool.
2. Confirm one coloured hull per zone with ≥3 geolocated members.
3. Pick a zone that shares repeaters with another — hulls should overlap.
4. Open **Zones** in the sidebar — check site counts and skipped counts match expectations.
5. Disable **Draw zone convex hulls** — shapes disappear; re-enable to restore.
6. Disable **Only Use Location = Yes** — hulls may grow if more members plot.
7. Zones with only simplex/PMR members (no coords) should show warn with no polygon.

## Known gaps

- Hull uses flat lat/lon math, not great-circle — fine for visual planning, not geodesic precision.
- No legend mapping zone name → colour (colours are index-order only).
- Zone member order from CPS is preserved in data but not visualised.
- No click-to-highlight zone members on the map.
- `Contacts.csv` / `TG_Lists.csv` are not read.

## Related

- [channels.md](channels.md) — markers, filters, `channelIndex`
- [map README](README.md) — hub and status table
