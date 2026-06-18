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
| Map | `src/components/ChannelMap/` | [map/](map/) | Shipped |

Add a row when a new feature is created.
