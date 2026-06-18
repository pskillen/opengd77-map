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
| Import | `src/lib/import/` | [import/](import/) | Shipped |
| Export | `src/lib/export/`, `src/routes/Export.tsx` | [export/](export/) | Shipped ([#38](https://github.com/pskillen/codeplug-tool/issues/38)) |
| Map | `src/components/CodeplugMap/` | [map/](map/) | Shipped |
| Report | `src/routes/`, `src/components/report/` | [report/](report/) | Shipped ([#6](https://github.com/pskillen/codeplug-tool/issues/6)) |
| CRUD | `src/routes/channels/`, `src/routes/zones/`, `src/lib/codeplugMutations.ts` | [crud/](crud/) | In progress ([#11](https://github.com/pskillen/codeplug-tool/issues/11), [#12](https://github.com/pskillen/codeplug-tool/issues/12)) |
| Maidenhead | `src/lib/maidenhead.ts` | [maidenhead.md](maidenhead.md) | Planned ([#11](https://github.com/pskillen/codeplug-tool/issues/11)) |
| Reference | `src/routes/reference/` | [reference/bands.md](../reference/bands.md) | Shipped ([#44](https://github.com/pskillen/codeplug-tool/issues/44)) |

## Reference

| Topic | Docs |
| --- | --- |
| UK amateur bands | [reference/bands.md](../reference/bands.md) |

Add a row when a new feature is created.
