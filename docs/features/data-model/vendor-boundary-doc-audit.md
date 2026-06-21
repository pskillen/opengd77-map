# Vendor-boundary documentation audit

Findings from a documentation sweep against the three codified principles. The fixes that land in **this** branch (PR [#96](https://github.com/pskillen/codeplug-tool/pull/96)) are the docs already touched while dropping `Channel.number`; everything else is catalogued here and scheduled against the [epic phases](pristine-model-refactor-progress.md).

## Principles audited

Codified in [`.cursor/rules/vendor-boundaries.mdc`](../../../.cursor/rules/vendor-boundaries.mdc) and [`.cursor/rules/format-agnostic-docs.mdc`](../../../.cursor/rules/format-agnostic-docs.mdc):

1. **External formats stay external.** Third-party data models live only at the import/export boundary; everything inside is converted to our own model. Generic/feature docs describe the internal model, not a CSV/wire shape.
2. **Internal FKs are UUID ids.** Relationships are keyed by stable `id`, never by human-readable, case-sensitive name strings. Remaining name FKs are **transitional** (→ UUID in [#93](https://github.com/pskillen/codeplug-tool/issues/93) Phase 4), not a pattern to extend.
3. **OpenGD77 is one format among siblings.** It shipped first; treating it as the default (in generic docs, examples, or reference tables that should be format-neutral) is the anti-pattern.

## Already fixed in this branch (PR #96)

These were files touched by the `Channel.number` work and are corrected here:

- [`data-model/README.md`](README.md) — name FKs reframed as transitional → UUID; OpenGD77-only pointers generalised to "format reference".
- [`AGENTS.md`](../../../AGENTS.md) — internal FK rules and "Preserve CPS quirks" scoped to the boundary; UUID-id stated as the target.
- [`persistence/README.md`](../persistence/README.md) — "OpenGD77 export" → "codeplug"; "CSV → codeplug" → "imported format → codeplug".
- [`map/README.md`](../map/README.md), [`map/channels.md`](../map/channels.md), [`map/zones.md`](../map/zones.md) — import examples no longer default to OpenGD77; name resolution flagged transitional; the `not in Channels.csv` reason string flagged as legacy wording.

## Outstanding findings (not fixed here)

Per the editor rule, these sit **outside the current task** and are scheduled rather than fixed in this branch. Each is mapped to the epic phase whose code change makes the doc edit correct (so the doc and the model move together), or marked **standalone** where it is a pure doc/anchor fix not tied to a model change.

| # | Location | Principle | Issue | Remediation | Phase |
| --- | --- | --- | --- | --- | --- |
| 1 | [`docs/features/crud/README.md`](../crud/README.md) L38–41 | 2 | "Wire-name FKs: Channels reference talk groups/contacts and RX group lists by **name**; RGL members are vendor names" presented as the internal concept | Reframe as transitional name FKs; describe id-keyed editing after conversion | **Phase 4** (FK-by-UUID) |
| 2 | [`src/components/crud/RxGroupListMemberPicker.md`](../../../src/components/crud/RxGroupListMemberPicker.md) L5, L13–14, L21 | 2 | Props doc describes `selectedNames: string[]` / `onChange(names)` as the membership model | Keep accurate to **today's** name-based props but label legacy/transitional; update to id refs when the component changes | **Phase 4** (component is in the audit's consumer list) |
| 3 | [`docs/reference/channel-modes.md`](../../reference/channel-modes.md) L19–30, L48 | 1, 3 | A generic mode reference table carries `OpenGD77 import` / `OpenGD77 export` columns and an OpenGD77-specific footnote | Move OpenGD77 wire mapping to the OpenGD77 reference; keep this table format-neutral (id, label, category, colour, applicability) | **Phase 2** (typed fields adds `docs/reference/` entries; do the split there) |
| 4 | [`src/lib/channels.ts`](../../../src/lib/channels.ts) L107 (+ doc echoes) | 1 | Resolution emits the literal reason string `not in Channels.csv` — a CSV filename leaking into model-layer output | Replace with a format-neutral reason (e.g. `unresolved member`); update `channels.test.ts` and the zones doc echo | **Phase 3** (provenance reshapes member resolution/reporting) |
| 5 | [`docs/features/crud/README.md`](../crud/README.md) L41 | 1, 3 | "Vendor CSV serialises names" frames export as CSV/OpenGD77-centric | Generalise to "the export adapter serialises per target format" | **Phase 4** (alongside FK doc rewrite) or standalone |
| 6 | [`.cursor/rules/codeplug-tool.mdc`](../../../.cursor/rules/codeplug-tool.mdc) L23–28 | 1 | "Channel map" section points at non-existent `src/components/ChannelMap/ChannelMap.tsx`, `src/routes/Map.tsx`, `src/lib/csv.ts` | Update anchors to `CodeplugMap`, real routes, and `src/lib/import/`; drop CSV-centric phrasing | **Standalone** (stale-anchor fix) |
| 7 | [`src/components/CodeplugMap/CodeplugMap.md`](../../../src/components/CodeplugMap/CodeplugMap.md) L5 | — | References the "former full-page `ChannelMap`" — fine as history, but verify no other live `ChannelMap` anchors remain | Confirm and leave, or note as historical | **Standalone** |
| 8 | [`README.md`](../../../README.md) (repo root) L53 | 3 | "import an OpenGD77 CPS export" as the headline shipped capability | Soften to "import a CPS export (OpenGD77 CSV today)"; keep OpenGD77 as the example, not the definition | **Standalone** (user-facing copy) |

## Notes for the next agent

- **Do not** convert transitional name FKs to an aspirational id-based API in docs ahead of the code. `contactName`, `rxGroupListName`, and `sourceMemberNames` are the **live** model fields until Phase 4; describe them as transitional wire baggage, not the target pattern.
- Items 1–5 are deliberately bundled into the phase that changes the underlying code so docs and model stay in lockstep (per the epic's "documentation per-phase, not deferred" rule).
- Items 6–8 are pure doc/anchor hygiene and can be cleaned up in any small docs PR.
