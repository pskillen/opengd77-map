# Map tool

Channels carry latitude/longitude and zones list their member channels, but vendor CPS gives no geographic overview. The map tool plots the **codeplug model** in the browser so you can see where repeaters sit, which channels lack coordinates, and whether zone footprints match the geography you intended.

The map consumes the **internal data model** (`Channel[]`, `Zone[]`) from the active project's codeplug — it does **not** parse CSV. Turning a vendor export into that model is the [import/export](../import-export/README.md) surface's job.

Implementation lives in the SPA under `src/components/CodeplugMap/` (react-leaflet inset map) and `src/lib/` (filters, geometry). Map settings (tile provider, Mapbox token, Maidenhead grid) are on `/settings`. The map is embedded on the Summary dashboard and Channels/Zones report pages rather than a standalone full-page view.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Channel markers | Shipped | FM / DMR / other colours, popups, merge co-located sites |
| Zone convex hulls | Shipped | Polygon, line (2 sites), circle (1 site); overlapping zones supported |
| Map tiles | Shipped | OpenStreetMap default; optional Mapbox streets / satellite |
| Filters & map controls | Shipped | Full-name labels and zone hulls on inset map; tile and grid settings on `/settings` |
| Maidenhead grid overlay | Shipped | 4/6-char grid lines + labels; [#50](https://github.com/pskillen/codeplug-tool/issues/50) |
| Operator marker | Shipped | Session “You” marker when browse position set — [operator-distance](../operator-distance/README.md) ([#70](https://github.com/pskillen/codeplug-tool/issues/70)) |
| Contacts / TG lists map layer | Deferred | Not geographic — out of scope for this tool |
| GitHub Pages deploy | Shipped | Publish GitHub release → `.github/workflows/pages.yml` |

## Documentation map

| Doc | Covers |
| --- | --- |
| [channels.md](channels.md) | `Channel` markers, filters, popups, labelling |
| [zones.md](zones.md) | `Zone` hull geometry, colours, multi-zone overlap |
| [maidenhead-grid.md](maidenhead-grid.md) | Maidenhead grid overlay on codeplug maps |
| [troubleshooting.md](troubleshooting.md) | Console warnings — app vs browser extensions |

CSV column mapping and parsing live at the [import/export](../import-export/README.md) surface, not in these map docs.

User-facing quick start remains in the [repository README](../../../README.md).

## Concepts

| Term | Meaning in this tool |
| --- | --- |
| **`channel.name`** | Display name; zone members resolve to channels by this string **case-sensitively** at import |
| **`channel.useLocation`** | Boolean on the model; when the filter is on, `false` channels are excluded from markers and zone hulls |
| **Plotted vs skipped** | A channel may exist in the codeplug but be hidden by filters, `hideFromMap`, or missing/invalid coordinates |
| **Merged marker** | Several channels sharing the same lat/lon (to 5 decimal places) shown as one marker with a combined popup |
| **Zone hull** | Convex polygon around distinct geolocated sites referenced by a zone — not a radio coverage model |
| **Plotted index** | In-memory map of **plotted** channel `id` → channel (`buildChannelById`); zone resolution uses only plotted channels |

## Data flow

The map starts from the codeplug model; CSV parsing happens earlier, at the import surface.

```mermaid
flowchart LR
  subgraph store [Codeplug store]
    CH["channels: Channel[]"]
    ZN["zones: Zone[]"]
  end
  subgraph filter [applyFilters + plotted index]
    PL[plotted channels]
    SK[skipped list]
  end
  subgraph layers [Leaflet layers]
    MK[markerLayer]
    ZL[zoneLayer hulls]
  end
  CH --> filter
  filter --> MK
  filter --> SK
  PL --> ZL
  ZN --> ZL
```

Zones resolve against the **plotted** channel index, so member coordinates exist only for channels that survive the filters. Member name → id resolution itself happens at import; the map relies on `Zone.memberChannelIds`.

## Cross-links

| Resource | URL |
| --- | --- |
| Component (source) | [`src/components/CodeplugMap/`](../../../src/components/CodeplugMap/) |
| Settings route | [`src/routes/Settings.tsx`](../../../src/routes/Settings.tsx) |
| Live (deployed) | [channels report](https://pskillen.github.io/codeplug-tool/#/channels) |
| Build / deploy | [docs/build/README.md](../../build/README.md) |
| Local test CSVs | [`sample-exports/`](../../../sample-exports/) (gitignored) |
| Agent guide | [`AGENTS.md`](../../../AGENTS.md) |
| Feature docs skill | [`.cursor/skills/feature-docs/SKILL.md`](../../../.cursor/skills/feature-docs/SKILL.md) |

## Related tools

This is currently the only feature in the repository. Future tools should get their own folder under `docs/features/<topic>/` and a row in [docs/features/README.md](../README.md).
