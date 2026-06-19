# Operator distance

Session-scoped operator position for **field use**: distance from me on channel detail, proximity sort and distance column on the channel list, and a you-are-here marker on embedded maps.

**Tracking:** [codeplug-tool#70](https://github.com/pskillen/codeplug-tool/issues/70) · builds on [#59](https://github.com/pskillen/codeplug-tool/issues/59) (device geolocation on edit/converter)

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Distance utilities | Shipped | `haversineDistanceM`, `formatDistanceM` in `src/lib/geoDistance.ts` |
| Session operator position | Shipped | `OperatorPositionProvider` / `useOperatorPosition` — memory only |
| CodeplugMap operator marker | Shipped | `operatorPosition` prop — blue “You” marker, included in bounds |
| Channel detail distance | Shipped | Location section + Use/Clear my location |
| Channel list sort + column | Shipped | Name / Distance from me; hideable distance column (default on) |
| Channel list distance filter | Shipped | Within distance switch + km slider; hides ungeolocated |
| Zone detail map marker | Shipped | Reuses session position |

## Documentation map

| Doc | Covers |
| --- | --- |
| [operator-distance-progress.md](operator-distance-progress.md) | Execution progress |
| [operator-distance-outstanding.md](operator-distance-outstanding.md) | Deferred scope and follow-ups |
| [Maidenhead](../maidenhead.md) | Edit/converter geolocation (#59) |
| [Map](../map/) | Channel markers and zone hulls |

## Concepts

| Term | Meaning |
| --- | --- |
| **Session position** | Operator lat/lon obtained via **Use my location**; lives in React context only — cleared on tab reload, not saved to localStorage or codeplug |
| **Edit/converter position** | Same button (#59) but parent owns persistence (save channel or copy from converter) |
| **Distance from me** | Haversine great-circle distance (WGS84, no elevation) between session position and channel coordinates |
| **hideFromMap** | Affects map plotting only; channels with coordinates still appear in distance sort and distance column |

### Distance display

- Below 1 km: metres rounded, e.g. `850 m`
- At or above 1 km: kilometres with one decimal, e.g. `12.4 km`
- No session position or no channel coordinates: `—`

## Code anchors

| Path | Role |
| --- | --- |
| `src/lib/geoDistance.ts` | Haversine + `formatDistanceM` |
| `src/lib/channels.ts` | `channelHasGeolocation` |
| `src/state/operatorPosition.tsx` | Session context |
| `src/routes/channels/detail.tsx` | Distance field, location controls |
| `src/routes/channels/list.tsx` | Sort, distance column, map |
| `src/routes/zones/detail.tsx` | Map marker |
| `src/components/CodeplugMap/CodeplugMap.tsx` | `operatorPosition` prop |
| `src/components/UseMyLocationButton/` | Shared geolocation button |

## Behaviour

- **Trigger:** explicit **Use my location** click only — no auto-prompt, no `watchPosition`
- **Privacy:** browser Geolocation API locally; never uploaded; session-only unless user saves a channel on edit
- **Permission denied:** inline error on button; rest of page usable
- **Distance sort:** geolocated channels ascending; unlocated at bottom (sub-sorted by name). Without session position, sort falls back to name with helper text
- **Distance filter:** **Within distance** switch on channel list — hides channels without coordinates (`Use Location` off or missing coords). Slider (5–200 km, marked) limits radius when session position is set; map shows filtered channels only
- **Maps:** operator marker distinct from channel markers; bounds include operator + channels when both present

## Manual verify

1. Channel detail → **Use my location** → distance appears; map shows channel + You markers
2. Deny permission → inline error; no distance
3. Channel list → sort by distance → nearest repeater first; unlocated channels last
4. **Within distance** filter → ungeolocated hidden; slider limits radius when location set
5. Distance column shows values when position set, `—` when not
6. Zone detail map → operator marker with zone hull
7. Reload page → position cleared; distance hidden until requested again
8. **Clear my location** → distance/marker removed across views

## Related

- [UseMyLocationButton sidecar](../../src/components/UseMyLocationButton/UseMyLocationButton.md)
- [CodeplugMap sidecar](../../src/components/CodeplugMap/CodeplugMap.md)
