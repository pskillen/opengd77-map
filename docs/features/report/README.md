# Read-only CPS report

Browse an imported OpenGD77 codeplug as tables and detail pages. Editing is tracked separately ([#11](https://github.com/pskillen/codeplug-tool/issues/11) channels, [#12](https://github.com/pskillen/codeplug-tool/issues/12) zones).

**Tracking:** [codeplug-tool#6](https://github.com/pskillen/codeplug-tool/issues/6)

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Summary overview | Shipped | Entity counts and preview names |
| List pages | Shipped | Channels, zones, talk groups, contacts, RX group lists |
| Detail pages | Shipped | Per-entity read-only views with cross-links |
| Inset map | Shipped | Reuses `CodeplugMap` on channels/zones list and detail |
| Map settings | Shipped | Tile provider + Mapbox token on `/settings` |
| External channel links | Shipped | RepeaterBook, RadioReference, QRZ on channel detail |

## Routes

| Path | Page |
| --- | --- |
| `/summary` | Overview cards (default after import/open) |
| `/channels` | Channel table + map |
| `/channels/:id` | Channel detail |
| `/zones` | Zone table + map |
| `/zones/:id` | Zone detail + member channels |
| `/talk-groups` | Talk group table |
| `/talk-groups/:id` | Talk group detail |
| `/contacts` | Contact table |
| `/contacts/:id` | Contact detail |
| `/rx-group-lists` | RX group list table |
| `/rx-group-lists/:id` | RGL detail + members |
| `/settings` | Map tile provider and Mapbox token |
| `/map` | Redirects to `/channels` (bookmark compat) |

Nav appears when a codeplug project is active. Use **Switch** on the active project bar to return to the project picker (`/`).

## Source layout

| Path | Role |
| --- | --- |
| `src/routes/Summary.tsx` | Summary cards |
| `src/routes/*List.tsx` | Entity list pages |
| `src/routes/*Detail.tsx` | Entity detail pages |
| `src/routes/Settings.tsx` | Map settings |
| `src/components/report/` | Shared table/detail UI |
| `src/components/CodeplugMap/` | Inset Leaflet map |
| `src/lib/reportLookup.ts` | Relationship helpers |

## Related

- [Data model](../data-model/README.md)
- [Map feature](../map/README.md) — rendering behaviour
- [Import](../import/README.md) — OpenGD77 CSV population
