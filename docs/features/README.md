# Feature documentation

Contributor-oriented docs for features in this SPA. User-facing usage stays in the [repository README](../../README.md).

Agent skills for documentation and execution tracking:

- [feature-docs](../../.cursor/skills/feature-docs/SKILL.md)
- [progress-tracking](../../.cursor/skills/progress-tracking/SKILL.md)

## Features

| Topic | Source | Docs | Status |
| --- | --- | --- | --- |
| Data model | `src/models/codeplug.ts` | [data-model/](data-model/) | Shipped |
| Codeplug projects | `src/models/codeplugProject.ts`, `src/state/codeplugStore.tsx` | [codeplug-project/](codeplug-project/) | Shipped (nascent) |
| Persistence | `src/state/codeplugStorage.ts` | [persistence/](persistence/) | Shipped |
| Import / export | `src/lib/import/`, `src/lib/export/`, `src/routes/ImportExport.tsx` | [import-export/](import-export/) | Shipped ([#38](https://github.com/pskillen/codeplug-tool/issues/38), [#58](https://github.com/pskillen/codeplug-tool/issues/58)) |
| Map | `src/components/CodeplugMap/` | [map/](map/) | Shipped |
| Report | `src/routes/`, `src/components/report/` | [report/](report/) | Shipped ([#6](https://github.com/pskillen/codeplug-tool/issues/6)) |
| CRUD | `src/routes/channels/`, `src/routes/zones/`, `src/lib/codeplugMutations.ts` | [crud/](crud/) | In progress ([#11](https://github.com/pskillen/codeplug-tool/issues/11), [#12](https://github.com/pskillen/codeplug-tool/issues/12)) |
| Maidenhead | `src/lib/maidenhead.ts`, `src/routes/reference/maidenhead.tsx` | [maidenhead.md](maidenhead.md) | Shipped ([#11](https://github.com/pskillen/codeplug-tool/issues/11) CRUD, [#47](https://github.com/pskillen/codeplug-tool/issues/47) converter) |
| Reference | `src/routes/reference/` | [reference/bands.md](../reference/bands.md) | Shipped ([#44](https://github.com/pskillen/codeplug-tool/issues/44)) |
| UI (icons) | `src/lib/iconSizes.ts`, routes/components | [ui/](ui/) | Shipped ([#64](https://github.com/pskillen/codeplug-tool/issues/64)) |
| UI (two-section nav) | `src/components/AppNav/`, `src/components/SectionNav/`, `src/nav/` | [ui/nav-progress.md](ui/nav-progress.md) | In progress ([#81](https://github.com/pskillen/codeplug-tool/issues/81)) |
| Operator distance | `src/lib/geoDistance.ts`, `src/state/operatorPosition.tsx` | [operator-distance/](operator-distance/) | Shipped ([#70](https://github.com/pskillen/codeplug-tool/issues/70)) |

## Reference

| Topic | Docs |
| --- | --- |
| UK amateur bands | [reference/bands.md](../reference/bands.md) |
| Channel modes | [reference/channel-modes.md](../reference/channel-modes.md) |
| OpenGD77 CPS CSV | [reference/opengd77/](../reference/opengd77/README.md) — generic wire format + [radio profiles](../reference/opengd77/radios/README.md) |

Add a row when a new feature is created.
