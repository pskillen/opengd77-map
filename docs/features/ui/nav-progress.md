# Two-section navbar — progress

**Tracking:** [codeplug-tool#81](https://github.com/pskillen/codeplug-tool/issues/81)  
**Branch:** `81/pskillen/two-section-navbar`

## Status

| Slice | Status | Notes |
| --- | --- | --- |
| 1 Shell scaffold | Complete | `src/nav/`, two-column `AppShell` |
| 2 AppNav + badges | Complete | `AppNav.tsx`, sidecar |
| 3 SectionNav shell | Complete | Reference + Settings sections |
| 4 Channels migrate | Complete | URL query + ChannelsSectionNav |
| 5 Other sections | Complete | Zones, import/export, DMR entity lists |
| 6 Docs + tests + PR | Complete | App tests, display conventions, UI README |

## Verify

- `npm run lint && npm run test && npm run build`
- `npm run dev` — desktop: primary + secondary; mobile: toolbar above content
- Channel `?q=` filter shareable via URL; vendor format via `?format=`

## PR

Open with `Closes #81`.
