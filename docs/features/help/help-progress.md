# Help — progress

**Tracking:** [#135](https://github.com/pskillen/codeplug-tool/issues/135)  
**Branch:** `135/pskillen/in-app-help`

## Status

| Slice | Description | Status |
| --- | --- | --- |
| 0 | Refresh discovery docs + progress scaffolding | Done |
| 1 | Content manifest + help UI primitives | Done |
| 2 | P1 Home, new project, summary | Done |
| 3 | P1 Import & export | Done |
| 4 | P2 Channels + repeater directories | Done |
| 5 | P2 Zones, TG, contacts, RGL | Done |
| 6 | Settings, reference, empty states | Done |
| 7 | Help hub + glossary | Done |
| 8 | Feature docs closeout | Done |

## Shipped

- Content manifest under `src/content/help/` (topics, glossary, format variance tables).
- UI primitives: `HelpPopover`, `HelpHint`, `HelpAlert`, `FormatVarianceTable`, `HelpMarkdown`.
- Inline help on P1/P2 surfaces per [help-surface-plan](../../reference/writing-styleguide/help-surface-plan.md).
- Help hub at `/help` and `/help/:topicId` with section nav and cross-links from popovers.
- Tests: `HelpPopover`, `FormatVarianceTable`, updated `App.test` nav assertions.

## Deferred

See [help-outstanding.md](help-outstanding.md).
