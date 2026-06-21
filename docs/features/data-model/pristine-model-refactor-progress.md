# Pristine internal data model refactor — progress

**Tracking (epic):** [codeplug-tool#93](https://github.com/pskillen/codeplug-tool/issues/93) · in-scope: [#91](https://github.com/pskillen/codeplug-tool/issues/91), [#53](https://github.com/pskillen/codeplug-tool/issues/53), [#52](https://github.com/pskillen/codeplug-tool/issues/52), [#54](https://github.com/pskillen/codeplug-tool/issues/54)
**Epic plan:** `.cursor/plans/vendor-neutral_data_model_epic_941d5a01.plan.md`
**Review doc:** [vendor-agnostic-review.md](vendor-agnostic-review.md)
**Outstanding:** [pristine-model-refactor-outstanding.md](pristine-model-refactor-outstanding.md)
**Doc audit:** [vendor-boundary-doc-audit.md](vendor-boundary-doc-audit.md) — documentation violations of the vendor-boundary / format-agnostic rules, scheduled by phase below

---

## Overall status

**Status:** In progress (Phase 1 complete, pending PR)

The model refactor is delivered as a **phased epic**. Each phase is a self-contained subplan, executed by a **separate agent session**, on its own branch + PR, merged to `main` **sequentially** before the next phase branches.

---

## Delivery model (read this first if you are a new agent)

1. One phase at a time. Do **not** start a phase until the previous phase's PR is merged to `main`.
2. Each phase branches `{ticket}/paddy/{slug}` from **`origin/main`** (latest).
3. Generate the phase's subplan first (use [make-a-plan](../../../.cursor/skills/make-a-plan/SKILL.md) in plan mode), then execute it.
4. Commit atomically as you go (per [git-workflow](../../../.cursor/skills/git-workflow/SKILL.md)); never batch into one end-of-phase commit.
5. **Update this file and the outstanding file at every checkpoint and before opening each PR.** This is the primary handoff channel between agent sessions.
6. Keep the OpenGD77/1701 import → edit → export → re-import round-trip green every phase.

---

## Carry-over state (update at the end of every phase)

The next agent relies on these values. Keep them accurate.

- **Current `CODEPLUG_SCHEMA_VERSION`:** 4 (Phase 1 landed on branch `53/paddy/drop-channel-number`)
- **Last merged phase:** Phase 0 (#91, PR #94)
- **`main` is at:** `c9b01a0` (after Phase 0 merge) — Phase 1 pending merge
- **Epic ticket:** [#93](https://github.com/pskillen/codeplug-tool/issues/93). No per-phase child tickets — FK-by-UUID and provenance/rename are folded under #93.
- **New tickets created in Phase 0:**
  - OpenGD77 export issues (tracking): [#95](https://github.com/pskillen/codeplug-tool/issues/95)
- **Shared test builders:** not created yet (planned Phase 2 at `src/test/builders`)
- **Provenance `meta` shape:** not designed yet (Phase 3) — Phase 4 (FK-by-UUID) depends on it
- **`vendorExtras` renamed to `opengd77Extras`?** No (Phase 3)

### Locked design decisions (do not relitigate)

- Epic with per-phase subplans/PRs, sequential to `main`.
- Dual-kind FK = discriminated ref `{ kind: 'talkGroup' | 'contact'; id }`; `TalkGroup` and `Contact` stay separate entities.
- `vendorExtras` → `opengd77Extras`; recurring extras may be promoted to first-class fields.
- `scanSkip` is first-class; `zoneSkip` stays an OpenGD77 extra.
- Field types per section 2 of the review doc: frequencies as integer **Hz**; `power`/`squelch` as percent with `null` = master; tones as a CTCSS/DCS string enum; `colourCode`/`timeslot`/`dmrId`/`transmitTimeout` nullable numbers/enums; `rxOnly` boolean.
- `Channel.number` removed from the model; assigned at OpenGD77 export.
- `aprsConfigName` stays a string FK until APRS is modelled.
- Vendor limits (e.g. zone member cap) belong at export only — never in model/mutations/validation/CRUD.

---

## Phase 0 — Audit close-out, new tickets, scaffold (#91)

**Status:** Complete (merged)
**Branch:** `91/paddy/data-model-vendor-agnostic-review`
**PR:** [#94](https://github.com/pskillen/codeplug-tool/pull/94) (Closes #91)

**Delivered**

- [vendor-agnostic-review.md](vendor-agnostic-review.md) (`74c4293`) + refined field types (`05f9142`).
- These tracking docs created (`62b39fe`).
- OpenGD77 export-issues tracker created: [#95](https://github.com/pskillen/codeplug-tool/issues/95).
- Fixed stale schema version in [persistence README](../persistence/README.md) (v1 → 3).

**Verify**

- Docs-only; no code changed.
- Tracking docs linked from [docs/features/README.md](../README.md) and the epic plan.

---

## Phase 1 — Drop `Channel.number` (#53)

**Status:** Complete (pending merge)
**Branch:** `53/paddy/drop-channel-number`
**PR:** [#96](https://github.com/pskillen/codeplug-tool/pull/96) (Closes #53)

**Delivered**

- Export assigns `Channel Number` sequentially (`0bdcf8c`).
- Import discards wire column; merge equality updated (`0f95e08`).
- Channel edit/detail UI no longer shows channel number (`de1f117`).
- `Channel.number` removed; schema v4 migration discards persisted values (`fb6ee6d`).
- Docs: data-model README, persistence schema v4, OpenGD77 reference, map channels.
- Doc-compliance pass on **touched** files (data-model README, AGENTS.md, persistence, map README/channels/zones): name FKs reframed as transitional → UUID, OpenGD77/CSV defaults generalised. Remaining violations catalogued in [vendor-boundary-doc-audit.md](vendor-boundary-doc-audit.md) and scheduled under the phases below.

**Verify**

- `npm run lint && npm run test && npm run build` green.
- v3→v4 migration fixture passes; round-trip test green.
- Original import channel numbers are not preserved (by design).

---

## Phase 2 — Typed channel fields + shared test builders (#52)

**Status:** Not started
**Branch:** `52/paddy/typed-channel-fields`

**Doc debt to clear in this phase** (from [doc audit](vendor-boundary-doc-audit.md) #3): when adding `docs/reference/` entries for power/squelch/tones, split the OpenGD77 `import`/`export` columns out of the generic [`docs/reference/channel-modes.md`](../../reference/channel-modes.md) mode table (and its OpenGD77 footnote) into the OpenGD77 reference, leaving `channel-modes.md` format-neutral.

---

## Phase 3 — Import provenance to per-entity `meta` + `opengd77Extras` rename (new ticket)

**Status:** Not started
**Branch:** `{ticket}/paddy/import-provenance-meta`

**Doc debt to clear in this phase** (from [doc audit](vendor-boundary-doc-audit.md) #4): when provenance reshapes member resolution/reporting, replace the literal `not in Channels.csv` reason string in [`src/lib/channels.ts`](../../../src/lib/channels.ts) with a format-neutral message; update `channels.test.ts` and the echo in [`map/zones.md`](../map/zones.md).

---

## Phase 4 — FKs by UUID, discriminated refs (new ticket)

**Status:** Not started
**Branch:** `{ticket}/paddy/fk-by-uuid`
**Prerequisite:** Phase 3 provenance `meta` shape merged.

**Doc debt to clear in this phase** (from [doc audit](vendor-boundary-doc-audit.md) #1, #2, #5): once FKs are id-keyed, rewrite the name-FK descriptions in [`crud/README.md`](../crud/README.md) (L38–41) and [`RxGroupListMemberPicker.md`](../../../src/components/crud/RxGroupListMemberPicker.md) (props move from `selectedNames` to id refs), and generalise "Vendor CSV serialises names" (crud README L41) to "the export adapter serialises per target format".

---

## Phase 5 — First-class naming + export name composition (#54)

**Status:** Not started
**Branch:** `54/paddy/first-class-callsign-naming`

---

## Standalone doc hygiene (not phase-bound)

From the [doc audit](vendor-boundary-doc-audit.md) #6–#8 — pure doc/anchor fixes, clearable in any small docs PR (not tied to a model change):

- [`.cursor/rules/codeplug-tool.mdc`](../../../.cursor/rules/codeplug-tool.mdc) "Channel map" section points at non-existent `ChannelMap.tsx` / `Map.tsx` / `csv.ts`; update to `CodeplugMap`, real routes, and `src/lib/import/`.
- [`README.md`](../../../README.md) (repo root) L53 — soften "import an OpenGD77 CPS export" to keep OpenGD77 as an example, not the definition.
- Confirm no other stale `ChannelMap` anchors remain (see [`CodeplugMap.md`](../../../src/components/CodeplugMap/CodeplugMap.md)).

## Next

- Merge PR #96 (Phase 1, closes #53).
- After merge, generate the Phase 2 subplan (#52 typed channel fields) in a fresh session; clear doc-audit #3 within it.
