# UI component kit — progress

**Tracking:** [codeplug-tool#105](https://github.com/pskillen/codeplug-tool/issues/105)  
**Branch:** `105/paddy/ui-component-kit`

## Status

| Slice | Status | Notes |
| --- | --- | --- |
| 1 Kickoff — tokens + docs | Complete | `tokens.ts`, theme defaults |
| 2 Layout primitives | Complete | `Page`, `PageHeader`, `PageSection`, `PageSectionGrid` |
| 3 DataTable + EmptyState | Complete | `EntityTable` re-exports `DataTable` |
| 4 Composites | Complete | `ListPage`, `FormPage`, `FormSection` |
| 5 Nav primitives | Complete | `AppHeader` |
| 6 Styleguide | Complete | `/#/styleguide` (unlinked) |
| 7 Import/export migrate | Complete | Reference layout |
| 8 List routes migrate | Complete | Five entity lists |
| 9 Detail routes migrate | Complete | + `DetailSections` → `PageSection` |
| 10 Edit routes migrate | Complete | `FormPage` sticky footer |
| 11 Remaining routes | Complete | Home, Summary, Settings, reference, project |
| 12 Cleanup + PR | Complete | `ReportPage` deprecated |
| 13 DataTable depth ([#138](https://github.com/pskillen/codeplug-tool/issues/138)) | Complete | See [datatable-progress.md](datatable-progress.md) |

## Verify

- `npm run format:check && npm run lint && npm run test && npm run build`
- `npm run dev` — `/#/styleguide` + spot-check routes

## PR

Open with `Closes #105`.
