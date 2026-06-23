# Repeater directories

Network-backed repeater lookup sources that populate the internal codeplug model — siblings to CPS file import, not another CSV format.

**Tracking:** [codeplug-tool#92](https://github.com/pskillen/codeplug-tool/issues/92) (ukrepeater.net)

## Problem

Operators hand-type repeater frequencies, tones, and locations. Authoritative UK listings live on [ukrepeater.net](https://ukrepeater.net) (RSGB ETCC API). The app should fetch listings by callsign, locator, band, or town and add or verify channels in the active codeplug.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| ukrepeater.net (ETCC API) | In progress | [#92](https://github.com/pskillen/codeplug-tool/issues/92) |
| RepeaterBook / other directories | Deferred | Generic `RepeaterDirectorySource` interface for future sources |
| Shared reference library target | Blocked | [#30](https://github.com/pskillen/codeplug-tool/issues/30) |

## Documentation map

| Doc | Role |
| --- | --- |
| [ukrepeater-progress.md](ukrepeater-progress.md) | Execution log |
| [ukrepeater-outstanding.md](ukrepeater-outstanding.md) | Discovered debt |
| [reference/ukrepeater/](../../reference/ukrepeater/README.md) | ETCC API field mapping |
| [data-model](../data-model/README.md) | Internal `Channel` model |
| [import-export](../import-export/README.md) | CPS file import (separate concern) |
| [crud](../crud/README.md) | Channel create/edit routes |

## Concepts

- **Directory vs CPS import:** CPS adapters parse local files; directory sources `fetch` remote JSON and map at the boundary via [`src/lib/repeaterDirectories/`](../../../src/lib/repeaterDirectories/).
- **Internal FKs:** Zone membership uses UUID `memberChannelIds`. Renaming a channel does not break zone membership — `updateChannel` refreshes export wire names in provenance only.
- **Provenance:** `meta.repeaterDirectory` stores remote listing id, fetch time, and snapshot metadata for verify/refresh — not export source of truth.
- **Vendor-neutral model:** No radio profile caps in mapper, mutations, or CRUD UI.

## Flows

### Search and add (Flow A)

Route: `/channels/add-from-ukrepeater`. Search → select listings → `addChannel` with stamped provenance.

### Verify existing (Flow B)

Channel detail → **Check ukrepeater.net** → diff remote vs local → selective apply via `updateChannel`.

Name apply: no zone-membership warning (UUID FKs). Block duplicate names via validation. Optional note that export label changes.

## Related

- [operator lifecycle](../workflows/operator-lifecycle.md)
- [map — channels](../map/channels.md)
