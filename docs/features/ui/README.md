# UI — icons

Contributor docs for shared UI conventions in the SPA.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Icon library (`@tabler/icons-react`) | In progress | [#64](https://github.com/pskillen/codeplug-tool/issues/64) |
| Shared size constants | In progress | `src/lib/iconSizes.ts` |
| Display conventions | In progress | [display-conventions.md](../../reference/display-conventions.md) |
| Shell navigation | Planned | `App.tsx`, reference index, ActiveProjectBar |
| CRUD actions | Planned | List/detail/edit routes |
| Import/export/workflows | Planned | ImportDropzone, Export, SummaryCard, ProjectList |
| Map/location | Planned | MapControls, UseMyLocationButton |

## Documentation map

| Doc | Purpose |
| --- | --- |
| [icons-progress.md](icons-progress.md) | Execution log |
| [icons-outstanding.md](icons-outstanding.md) | Debt discovered during rollout |
| [display-conventions.md](../../reference/display-conventions.md) | Icon sizes, stroke, a11y rules |

## Concepts

Icons use [Tabler Icons](https://tabler.io/icons) via `@tabler/icons-react` — the set Mantine documents and examples use. Import icons by name per file; do not barrel-re-export.

Icons aid **scanning and primary actions** (nav, New/Edit/Delete, import/export). Data-dense surfaces (tables, badges, frequency text) stay text-first.

## Related

- Tracking: [codeplug-tool#64](https://github.com/pskillen/codeplug-tool/issues/64)
- Plan: `.cursor/plans/icon_library_rollout_f91bef48.plan.md`
