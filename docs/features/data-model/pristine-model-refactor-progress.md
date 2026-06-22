# Pristine internal data model refactor — progress

**Tracking (epic):** [codeplug-tool#93](https://github.com/pskillen/codeplug-tool/issues/93) · in-scope: [#91](https://github.com/pskillen/codeplug-tool/issues/91), [#53](https://github.com/pskillen/codeplug-tool/issues/53), [#52](https://github.com/pskillen/codeplug-tool/issues/52), [#54](https://github.com/pskillen/codeplug-tool/issues/54)
**Epic plan:** `.cursor/plans/vendor-neutral_data_model_epic_941d5a01.plan.md`
**Review doc:** [vendor-agnostic-review.md](vendor-agnostic-review.md)
**Outstanding:** [pristine-model-refactor-outstanding.md](pristine-model-refactor-outstanding.md)
**Doc audit:** [vendor-boundary-doc-audit.md](vendor-boundary-doc-audit.md) — documentation violations of the vendor-boundary / format-agnostic rules, scheduled by phase below

---

## Overall status

**Status:** In progress (Phase 4 complete on branch `93/paddy/fk-by-uuid`, PR pending)

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

- **Current `CODEPLUG_SCHEMA_VERSION`:** 7
- **Last merged phase:** Phase 3 (provenance meta + opengd77Extras rename) — Phase 4 ready on branch `93/paddy/fk-by-uuid`
- **`main` is at:** after Phase 3 merge — Phase 4 PR pending
- **Epic ticket:** [#93](https://github.com/pskillen/codeplug-tool/issues/93). No per-phase child tickets — FK-by-UUID and provenance/rename are folded under #93.
- **New tickets created in Phase 0:**
  - OpenGD77 export issues (tracking): [#95](https://github.com/pskillen/codeplug-tool/issues/95)
- **Shared test builders:** `src/test/builders/` (Phase 2)
- **Provenance `meta` shape:** `EntityMeta.imported: { formatId, sourceFile, importedAt, memberWireNames?, contactWireName?, rxGroupListWireName? }` — accessors in `src/lib/entityProvenance.ts`
- **`vendorExtras` renamed to `opengd77Extras`?** Yes (Phase 3)

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

**Status:** Complete (merged)
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

**Status:** Complete (merged)
**Branch:** `52/paddy/typed-channel-fields`
**PR:** [#98](https://github.com/pskillen/codeplug-tool/pull/98) (Closes #52)

**Delivered**

- Schema v5 typed `Channel` fields (Hz frequencies, percent power/squelch, tone enum, DMR scalars, `rxOnly` boolean).
- Neutral helpers in `src/lib/channelFields/`; OpenGD77 wire mapping in `src/lib/import|export/opengd77/channelWire.ts`.
- v4→v5 migration on load; shared test builders at `src/test/builders/`.
- Channel CRUD and map UI updated for typed controls.
- Doc audit #3: OpenGD77 import/export columns removed from generic `channel-modes.md`; wire rules in `docs/reference/opengd77/`.

**Verify**

- `npm run lint && npm run test && npm run build` green.
- v4→v5 migration fixture passes; OpenGD77 round-trip test green.

---

## Phase 3 — Import provenance to per-entity `meta` + `opengd77Extras` rename (new ticket)

**Status:** Complete (merged)
**Branch:** `93/paddy/import-provenance-meta`

**Delivered**

- Per-entity `EntityMeta.imported` provenance; zone/RGL member wire names in `meta.imported.memberWireNames`.
- `vendorExtras` → `opengd77Extras`; schema v6 migration (v5→v6 fixture).
- Accessors in `src/lib/entityProvenance.ts`; import stamps provenance on OpenGD77 parse.
- Neutral unresolved member reason string in map layer (`unresolved member`).

**Doc debt cleared:** vendor-boundary doc audit #4 (map zones + channels.ts reason string).

**Verify**

- `npm run lint && npm run test && npm run build` green.
- v5→v6 migration fixture passes; OpenGD77 round-trip test green.

---

## Phase 4 — FKs by UUID, discriminated refs (new ticket)

**Status:** Complete (PR pending)
**Branch:** `93/paddy/fk-by-uuid`
**Prerequisite:** Phase 3 provenance `meta` shape merged.

**Delivered**

- `EntityRef` type and resolution/export helpers (`src/lib/entityRefs.ts`).
- `Channel.contactRef` replaces `contactName`; `Channel.rxGroupListId` replaces `rxGroupListName`.
- `RxGroupList.memberRefs` replaces internal name membership; wire names in provenance only.
- Schema v7 migration (v6→v7 fixture); import merge resolves refs after entity merge.
- CRUD, validation, mutations, report lookups, and map popups use id-based FKs.
- `aprsConfigName` unchanged (string FK until APRS modelled).

**Doc debt cleared:** vendor-boundary doc audit #1, #2, #5 (data-model README, crud README, RxGroupListMemberPicker sidecar).

**Verify**

- `npm run lint && npm run test && npm run build` green.
- v6→v7 migration fixture passes (channels + RGL memberRefs); OpenGD77 round-trip test green.

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

- Merge Phase 4 PR; branch Phase 5 from `origin/main` when ready (#54).
