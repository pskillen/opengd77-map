# Operator distance

Session-scoped operator position for field use: distance from me on channel detail, proximity sort on the channel list, and a you-are-here marker on embedded maps.

**Tracking:** [codeplug-tool#70](https://github.com/pskillen/codeplug-tool/issues/70)

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Distance utilities | Complete | `src/lib/geoDistance.ts` |
| Session operator position | Planned | `src/state/operatorPosition.tsx` |
| CodeplugMap operator marker | Planned | `operatorPosition` prop |
| Channel detail distance | Planned | Location section + map |
| Channel list sort + column | Planned | Name / Distance from me |
| Zone detail map marker | Planned | Reuse session position |

## Documentation map

| Doc | Covers |
| --- | --- |
| [operator-distance-progress.md](operator-distance-progress.md) | Execution progress |
| [operator-distance-outstanding.md](operator-distance-outstanding.md) | Skipped scope and follow-ups |
| [Maidenhead](../maidenhead.md) | Device geolocation on edit/converter (#59) |
| [Map](../map/) | Channel markers and zone hulls |

## Related

- Builds on [#59](https://github.com/pskillen/codeplug-tool/issues/59) (`UseMyLocationButton`, `useGeolocation`)
- [`src/components/UseMyLocationButton/`](../../../src/components/UseMyLocationButton/)
