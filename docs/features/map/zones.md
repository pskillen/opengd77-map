# Zones layer

Convex hull overlays — how `Zone` members become coloured shapes on the map.

See the [map hub](README.md) for shared concepts. Channel filtering is defined in [channels.md](channels.md).

## Purpose

Documents zone member resolution against plotted channels, hull geometry, and sidebar feedback. The map consumes the **internal `Zone` model** only — it never parses CSV. A channel may belong to **multiple zones**; each zone builds its hull independently from its own member list.

## Code anchors

| Symbol / region | File | Role |
| --- | --- | --- |
| `zoneGeolocatedPoints` | `src/lib/channels.ts` | Resolve `Zone` members → lat/lon with skip reasons |
| `uniqueLatLon` | `src/lib/geo.ts` | Dedupe sites to 5 decimal places |
| `convexHullLatLon` | same | Andrew's monotone chain on `[lat, lon]` |
| `zoneColor` | same | Distinct hue per zone index |
| Zone hull rendering | `src/components/CodeplugMap/CodeplugMap.tsx` | react-leaflet polygon / polyline / circle layers |

## Inputs — the `Zone` model

The map receives `Zone[]` and the full `Channel[]` as props (from the active project's codeplug). See [data model — Zone](../data-model/README.md#zone) for the full shape.

| Field | Type | Used for |
| --- | --- | --- |
| `name` | `string` | Tooltip, popup title, sidebar list |
| `memberChannelIds` | `string[]` | Resolved member channels — the points a hull is built from |
| `sourceMemberNames` | `string[]` | Wire member names; used to report members that did not resolve to a channel |

Member names are resolved to channel ids at **import** (see [OpenGD77 import surface](../import-export/opengd77/README.md)), case-sensitively. The map works from the already-resolved `memberChannelIds`; `sourceMemberNames` only drives the "member not found" reporting below. How `Zone Name` and `Channel1…ChannelN` columns become this model is documented at the import surface, not here.

## UI controls

Controls are Mantine inputs in [`MapControls`](../../../src/components/CodeplugMap/MapControls.md) bound to React state in `CodeplugMap.tsx` (no DOM ids).

| Control label | State | Default | Effect |
| --- | --- | --- | --- |
| Draw zones | `showZoneHulls` | on | When off, no hull layers render; the sidebar Zones list is also empty (it is derived from the computed `zoneHulls`) |

Shared coordinate filters (`requireUseLocation`, `skipZero`) apply to hull points the same way as markers — see [channels.md](channels.md).

## Behaviour

### Member resolution

`zoneGeolocatedPoints` iterates `zone.memberChannelIds`, looking each up in the plotted-channel index, and reports any `sourceMemberNames` with no matching channel:

| Condition | Result |
| --- | --- |
| `sourceMemberNames` entry has no matching channel | Reported — `not in Channels.csv` (name never resolved) |
| Member id not in the plotted index | Reported — `filtered out or missing coordinates` |
| Member channel has no `location` | Reported — `no coordinates` |
| `0, 0` with **Skip 0,0** on | Reported — `0,0 coordinates` |
| `useLocation` false with filter on | Reported — `Use Location = No` |
| Otherwise | Point `[lat, lon]` added |

Distinct sites are deduplicated with `toFixed(5)` on lat and lon.

### Hull geometry

| Geolocated sites | Shape | react-leaflet | Parameters |
| --- | --- | --- | --- |
| 0 | None | — (geometry `none`) | Sidebar warning: "no geolocated members" |
| 1 | Circle | `<Circle>` | Radius **2500 m**, fill opacity 0.18, weight 2 |
| 2 | Line | `<Polyline>` | Weight 3, opacity 0.85 |
| ≥ 3 | Convex hull | `<Polygon>` | `convexHullLatLon`; fill opacity **0.18**, weight 2 |

Each zone's shape is precomputed into a `ZoneHullData` object (`geometry: 'circle' | 'line' | 'polygon' | 'none'`) in a `useMemo`, then rendered by the matching react-leaflet component.

The hull algorithm sorts by longitude then latitude and runs monotone-chain convex hull in the lat/lon plane. This is a **planning aid**, not RF coverage — adequate for regional repeater layouts at UK latitudes.

### Colours

`zoneColor(index)` assigns hue `(index × 137.508) mod 360` for golden-angle spacing:

- Stroke: `hsla(hue, 70%, 38%, 0.9)`
- Fill uses stroke colour with polygon/circle `fillOpacity: 0.18`

Zone shapes are rendered before the channel markers in `CodeplugMap.tsx`, so markers stay on top. Overlapping hulls from shared repeaters are expected and render transparently.

### Sidebar — Zones panel

The sidebar **Zones** panel — a Mantine `Text` toggle plus `Collapse` (state `zonesOpen`) — appears when zones are present. Each zone lists:

- **ok** — hull drawn; shows vertex/site counts and optional skipped member count
- **warn** — no geolocated members, or some members skipped (still draws hull if ≥1 site)

Popups include zone name, member count, shape note, and count of members without coords.

### Multi-zone channels

A channel in both `Glasgow` and `Edinburgh` zones contributes its coordinates to **both** hulls. There is no single "primary" zone on the map — overlap is intentional.

### Stats line

When zones are present, stats append `· **N** zones`.

## Browser storage

Zone data persists with the rest of the codeplug via the **projects store** (see [channels.md](channels.md#browser-storage)). Hull visibility follows the **Draw zones** checkbox only (not stored in `localStorage`).

## Manual verify

1. Ensure the active project has channels and zones (e.g. import an OpenGD77 export).
2. Confirm one coloured hull per zone with ≥3 geolocated members.
3. Pick a zone that shares repeaters with another — hulls should overlap.
4. Open **Zones** in the sidebar — check site counts and skipped counts match expectations.
5. Disable **Draw zones** — shapes disappear; re-enable to restore.
6. Disable **Only Use Location = Yes** — hulls may grow if more members plot.
7. Zones with only simplex/PMR members (no coords) should show warn with no polygon.

## Known gaps

- Hull uses flat lat/lon math, not great-circle — fine for visual planning, not geodesic precision.
- No legend mapping zone name → colour (colours are index-order only).
- Zone member order is preserved in the model but not visualised.
- No click-to-highlight zone members on the map.

## Related

- [channels.md](channels.md) — markers, filters, plotted index
- [CodeplugMap.md](../../../src/components/CodeplugMap/CodeplugMap.md) — component props and embedding
- [map README](README.md) — hub and status table
