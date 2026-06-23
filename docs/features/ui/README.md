# UI — icons, navigation, and component kit

Contributor docs for shared UI conventions in the SPA.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Icon library (`@tabler/icons-react`) | Shipped | [#64](https://github.com/pskillen/codeplug-tool/issues/64) |
| Shared size constants | Shipped | `src/lib/iconSizes.ts` |
| Display conventions | Shipped | [display-conventions.md](../../reference/display-conventions.md) |
| Two-section navigation | Shipped | [#81](https://github.com/pskillen/codeplug-tool/issues/81) — `AppNav`, `SectionNav`, `src/nav/` |
| Layout & component kit | Shipped | [#105](https://github.com/pskillen/codeplug-tool/issues/105) — `src/components/ui/`, `/#/styleguide` |
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
| [component-kit-progress.md](component-kit-progress.md) | Component kit execution log ([#105](https://github.com/pskillen/codeplug-tool/issues/105)) |
| [component-kit-outstanding.md](component-kit-outstanding.md) | Kit debt discovered during #105 |
| [display-conventions.md](../../reference/display-conventions.md) | Icons, badges, nav layout |

## Layout & component kit

Shared page chrome lives in [`src/components/ui/`](../../src/components/ui/). **Reference layout:** import/export (`src/routes/ImportExport.tsx`) — page title + dimmed description, bordered section cards in a responsive grid.

### Page width tokens

Defined in [`tokens.ts`](../../src/components/ui/tokens.ts) and applied via `Page`:

| Variant | Mantine `Container` size | Typical routes |
| --- | --- | --- |
| `narrow` | `sm` | Home, Settings |
| `default` | `lg` | CRUD, import/export, report |
| `wide` | `xl` | Reserved for data-heavy reference pages |

### Spacing conventions

| Token | Value | Use |
| --- | --- | --- |
| `PAGE_STACK_GAP` | `lg` | Between major page blocks |
| `PAGE_HEADER_GAP` | `xs` | Title + description |
| `PAGE_SECTION_GAP` | `md` | Inside bordered section cards |
| Section card | `Paper withBorder`, `p="md"`, `radius="md"` | Grouped settings, import/export panels |

### Styleguide

Hidden dev route (no nav link): `/#/styleguide` — demos every kit primitive.

### Primitives inventory

| Component | Role |
| --- | --- |
| `Page` | Outer shell — width, vertical padding |
| `PageHeader` | `Title order={1}` + description + optional actions |
| `PageSection` | Bordered card with optional title/description |
| `PageSectionGrid` | Responsive 1–2 column section layout |
| `ListPage` | List-route shell |
| `FormPage` | Edit-route shell with sticky mobile footer |
| `FormSection` | Titled field group |
| `DataTable` | Entity list table with empty state |
| `EmptyState` | Zero-row / empty project placeholder |

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
