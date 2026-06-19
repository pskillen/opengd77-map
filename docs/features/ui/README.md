# UI — icons and shell navigation

Contributor docs for shared UI conventions in the SPA.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Icon library (`@tabler/icons-react`) | Shipped | [#64](https://github.com/pskillen/codeplug-tool/issues/64) |
| Shared size constants | Shipped | `src/lib/iconSizes.ts` |
| Display conventions | Shipped | [display-conventions.md](../../reference/display-conventions.md) |
| Two-section navigation | Shipped | [#81](https://github.com/pskillen/codeplug-tool/issues/81) — `AppNav`, `SectionNav`, `src/nav/` |
| CRUD actions | Shipped | List/detail/edit routes, ConfirmDeleteModal, ZoneMemberPicker |
| Import/export/workflows | Shipped | ImportDropzone, Export, SummaryCard, ProjectList |
| Map/location | Shipped | MapControls, UseMyLocationButton |

## Documentation map

| Doc | Purpose |
| --- | --- |
| [icons-progress.md](icons-progress.md) | Icons rollout log |
| [icons-outstanding.md](icons-outstanding.md) | Icons debt |
| [nav-progress.md](nav-progress.md) | Two-section nav execution log ([#81](https://github.com/pskillen/codeplug-tool/issues/81)) |
| [nav-outstanding.md](nav-outstanding.md) | Nav debt discovered during #81 |
| [display-conventions.md](../../reference/display-conventions.md) | Icons, badges, nav layout |

## Two-section navigation architecture

```
┌──────────────┬─────────────────┬──────────────────────────┐
│  AppNav      │  SectionNav     │  Routes (main content)   │
│  (primary)   │  (secondary)    │                          │
└──────────────┴─────────────────┴──────────────────────────┘
```

| Piece | Path | Role |
| --- | --- | --- |
| Primary nav | `src/components/AppNav/` | Project routes, `ActiveProjectBar`, Reference/Settings |
| Secondary nav | `src/components/SectionNav/` | Section filters, New actions, sub-links |
| Registry | `src/nav/sectionNavRegistry.ts` | Pathname prefix → section component |
| Nav config | `src/nav/primaryNavItems.ts` | Icons, labels, entity count keys |

**Desktop:** both columns in `AppShell.Navbar` (~480px when secondary visible). **Mobile:** `useMediaQuery` shows secondary as a `Paper` toolbar above `<Routes>`.

**Summary** (`/summary`) has no registry entry — secondary column hidden.

**State:** URL search params for shareable filters (`useChannelListQuery`, `useListNameQuery`, `useVendorFormatParam`); channel column visibility stays in `localStorage`.

## Concepts

Icons use [Tabler Icons](https://tabler.io/icons) via `@tabler/icons-react`. Import by name per file; do not barrel-re-export.

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
| Import & export | `IconArrowsLeftRight` |
| Reference | `IconBook` |
| Settings | `IconSettings` |

## Related

- Tracking: [codeplug-tool#64](https://github.com/pskillen/codeplug-tool/issues/64) (icons), [#81](https://github.com/pskillen/codeplug-tool/issues/81) (nav)
- Component sidecars: `AppNav.md`, `SectionNav.md`
