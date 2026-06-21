# Zones layer

Convex hull overlays — how a `Zone`'s members become coloured shapes on the map.

See the [map hub](README.md) for shared concepts. Channel filtering and the plotted-channel index are defined in [channels.md](channels.md). Entity shapes are in the [data model](../data-model/README.md); CSV parsing belongs to the [import/export surface](../import-export/README.md).

## Purpose

Documents zone member resolution against plotted channels, hull geometry, and sidebar feedback — all from the internal [`Zone`](../data-model/README.md#zone) model. A channel may belong to **multiple zones**; each zone builds its hull independently from its own member list.

## Code anchors

| Symbol / region | File | Role |
| --- | --- | --- |
| `zoneGeolocatedPoints` | `src/lib/channels.ts` | Resolve `Zone` members → lat/lon with skip reasons |
| `buildChannelById` | same | Plotted channels indexed by internal `id` |
| `buildNameToChannelId` | `src/lib/codeplug.ts` | Name → id map for unresolved-member reporting |
| `uniqueLatLon` | `src/lib/geo.ts` | Dedupe sites to 5 decimal places |
| `convexHullLatLon` | same | Andrew's monotone chain on `[lat, lon]` |
| `zoneColor` | same | Distinct hue per zone index |
| Zone hull rendering | `src/components/CodeplugMap/CodeplugMap.tsx` | react-leaflet polygon / polyline / circle layers |

## Inputs — the `Zone` model

The map consumes these [`Zone`](../data-model/README.md#zone) fields:

| Field | Used for |
| --- | --- |
| `name` | Tooltip, popup title, sidebar list |
| `memberChannelIds` | Resolved channel ids — the authoritative membership the map plots |
| `sourceMemberNames` | Original wire member names — used to report members that resolve to no channel |

Membership is resolved to ids **at import** (`resolveZoneMembers`), case-sensitive on channel `name`. The map resolves those ids against the **plotted** channel set (`buildChannelById`), so members hidden by filters are reported as skipped rather than plotted.

### Zone record (in memory)

```json
{
  "id": "8b1f…",
  "name": "Glasgow",
  "memberChannelIds": ["id-hotspot", "id-gb7gl", "id-gb3gl"],
  "sourceMemberNames": ["Hotspot", "GB7GL Glasgow", "GB3GL Glasgow"]
}
```

Duplicate member ids within one zone are deduplicated while preserving first occurrence order (`seenIds` in `zoneGeolocatedPoints`).

## Controls

| Control | Source | Default | Effect |
| --- | --- | --- | --- |
| Draw zones | [`MapControls`](../../../src/components/CodeplugMap/MapControls.md) toggle | on | When off, no hull layers render and the sidebar Zones list is empty (derived from computed hulls) |

The fixed coordinate filters (`useLocation`, skip `0,0`) apply to hull points the same way as markers — see [channels.md](channels.md).

## Behaviour

### Member resolution

For each member, `zoneGeolocatedPoints` produces a point or a skip reason:

| Condition | Result |
| --- | --- |
| `sourceMemberNames` entry resolves to no channel | Reported missing — reason `not in Channels.csv` |
| Member id not in the plotted set | Skipped — `filtered out or missing coordinates` |
| Channel has no `location` | Skipped — `no coordinates` |
| `0, 0` with **Skip 0,0** on | Skipped — `0,0 coordinates` |
| `useLocation === false` with the filter on | Skipped — `Use Location = No` |
| Otherwise | Point `[lat, lon]` added |

Distinct sites are deduplicated with `toFixed(5)` on lat and lon. (`not in Channels.csv` is the literal reason string emitted by `src/lib/channels.ts` today; it means a member name with no matching channel in the codeplug. The CSV-era wording is legacy vendor leak slated for a generic, format-neutral message — see the [vendor-boundary doc audit](../data-model/vendor-boundary-doc-audit.md).)

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
- Fill uses the stroke colour with polygon/circle `fillOpacity: 0.18`

Zone shapes render before channel markers in `CodeplugMap.tsx`, so markers stay on top. Overlapping hulls from shared repeaters are expected and render transparently.

### Sidebar — Zones panel

The sidebar **Zones** panel appears when zones are present. Each zone lists:

- **ok** — hull drawn; shows vertex/site counts and optional skipped member count
- **warn** — no geolocated members, or some members skipped (still draws a hull if ≥1 site)

Popups include zone name, member count (`sourceMemberNames.length`), shape note, and count of members without coords.

### Multi-zone channels

A channel in both `Glasgow` and `Edinburgh` zones contributes its coordinates to **both** hulls. There is no single "primary" zone on the map — overlap is intentional.

### Stats line

When zones are present, stats append `· **N** zones`.

## Browser storage

Zone membership persists as part of the codeplug (see [persistence/](../persistence/README.md)). Hull visibility follows the **Draw zones** toggle only (not stored in `localStorage`).

## Manual verify

1. Open a project with channels and zones (import a codeplug — OpenGD77 CSV is the importer shipped today — or use an existing project).
2. Confirm one coloured hull per zone with ≥3 geolocated members.
3. Pick a zone that shares repeaters with another — hulls should overlap.
4. Open **Zones** in the sidebar — check site counts and skipped counts match expectations.
5. Disable **Draw zones** — shapes disappear; re-enable to restore.
6. A zone whose members are all non-geolocated (e.g. simplex/PMR) should show a warn with no polygon.

## Known gaps

- Hull uses flat lat/lon math, not great-circle — fine for visual planning, not geodesic precision.
- No legend mapping zone name → colour (colours are index-order only).
- Zone member order is preserved in the model but not visualised.
- No click-to-highlight of zone members on the map.

## Related

- [channels.md](channels.md) — markers, filters, plotted-channel index
- [data model — Zone](../data-model/README.md#zone) — internal entity
- [map README](README.md) — hub and status table
