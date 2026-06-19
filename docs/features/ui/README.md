# UI — icons

Contributor docs for shared UI conventions in the SPA.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Icon library (`@tabler/icons-react`) | Shipped | [#64](https://github.com/pskillen/codeplug-tool/issues/64) |
| Shared size constants | Shipped | `src/lib/iconSizes.ts` |
| Display conventions | Shipped | [display-conventions.md](../../reference/display-conventions.md) |
| Shell navigation | Shipped | `App.tsx`, reference index, ActiveProjectBar |
| CRUD actions | Shipped | List/detail/edit routes, ConfirmDeleteModal, ZoneMemberPicker |
| Import/export/workflows | Shipped | ImportDropzone, Export, SummaryCard, ProjectList |
| Map/location | Shipped | MapControls, UseMyLocationButton |

## Documentation map

| Doc | Purpose |
| --- | --- |
| [icons-progress.md](icons-progress.md) | Execution log |
| [icons-outstanding.md](icons-outstanding.md) | Debt discovered during rollout |
| [display-conventions.md](../../reference/display-conventions.md) | Icon sizes, stroke, a11y rules |

## Concepts

Icons use [Tabler Icons](https://tabler.io/icons) via `@tabler/icons-react` — the set Mantine documents and examples use. Import icons by name per file; do not barrel-re-export.

Icons aid **scanning and primary actions** (nav, New/Edit/Delete, import/export). Data-dense surfaces (tables, badges, frequency text) stay text-first.

### Entity icon mapping (navbar + summary cards)

| Entity | Icon |
| --- | --- |
| Summary | `IconLayoutDashboard` |
| Channels | `IconAntenna` |
| Zones | `IconFolders` |
| Talk groups | `IconUsersGroup` |
| Contacts | `IconAddressBook` |
| RX Group Lists | `IconListDetails` |
| Export | `IconDownload` |
| Reference | `IconBook` |
| Settings | `IconSettings` |

## Related

- Tracking: [codeplug-tool#64](https://github.com/pskillen/codeplug-tool/issues/64)
