# Internal data model — vendor-agnostic review

**Purpose:** a point-in-time review (Jun 2026) of the internal codeplug model against the goal of being genuinely **format- and radio-agnostic**, with a concrete list of changes required. This is **planning input** for the data-model epic — it feeds [#91](https://github.com/pskillen/codeplug-tool/issues/91) (audit), [#52](https://github.com/pskillen/codeplug-tool/issues/52) (typed channel fields), and [#53](https://github.com/pskillen/codeplug-tool/issues/53) (drop `Channel.number`). Fold conclusions into the canonical [data-model README](README.md) as the work lands.

**Source reviewed:** `[src/models/codeplug.ts](../../../src/models/codeplug.ts)` (schema v3), the OpenGD77 adapter (`src/lib/import/opengd77/`, `src/lib/export/opengd77/`), merge/resolution (`src/lib/importMerge.ts`, `src/lib/codeplug.ts`), CRUD mutations and validation (`src/lib/codeplugMutations.ts`, `src/lib/validation/`), channel routes (`src/routes/channels/`), and persistence/migration (`src/state/codeplugStorage.ts`).

Mental model and "format vs variant" framing: [format-taxonomy](../import-export/format-taxonomy.md). This document does not repeat that — it focuses on the **model** and the **edits required**.

---

## TL;DR

The model is structurally sound (stable internal ids, name-based FKs at the boundary, `vendorExtras` escape hatch, partial boolean/mode normalisation) but still **over-centres OpenGD77** in three ways:

1. **Opaque wire strings.** Many `Channel` fields store raw OpenGD77 wire values (`power: 'Master'`, `squelch: '75%'`, `rxOnly: 'Yes'`, `bandwidthKHz: '12.5'`, `colourCode`, `timeslot`, tones) as untyped strings. Translation should happen at the boundary, not be deferred to "pass-through". → **#52**
2. `**Channel.number` is a CPS slot index.** It has no neutral meaning and should be assigned at export, not stored. → **#53**
3. **Vendor cardinality leaks into CRUD.** `OPENGD77_MAX_ZONE_MEMBERS = 80` is enforced in mutations, validation, and UI — a documented anti-pattern (limits belong at export). Plus the entity set is implicitly DMR-centric, which an analogue-only format (CHIRP) would break.

The audit (#91) additionally confirms a handful of **doc/code drift** points worth ticketing.

---

## 1. Model-vs-docs audit (#91)

Walking the [data-model README](README.md) and [OpenGD77 reference](../../reference/opengd77/README.md) against shipped code. Per the reference hub, **code wins until fixed**; items below are either confirmed aligned or flagged.


| Area                                         | Status     | Note                                                                                                                                                                                                                                              |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-column channel mapping                   | ✅ Aligned  | `parse.ts` / `serialise.ts` use header-name lookup via `CHANNEL_COL`; round-trips the documented columns.                                                                                                                                         |
| Boolean conversions                          | ⚠️ Partial | `voxEnabled`, `scanSkip` (`All Skip`), `useLocation` normalised to `boolean`. `**rxOnly` is *not*** — stored as raw `'Yes'`/`'No'` string despite being a boolean. Doc and code agree, but it is inconsistent with the other three.               |
| `Zone Skip` vs `All Skip`                    | ⚠️ Note    | Only `All Skip` → `scanSkip`. `Zone Skip` is dropped into `vendorExtras`. Documented, but the two scan-skip concepts are not modelled neutrally.                                                                                                  |
| `ID Type` → `TalkGroup`/`Contact`            | ✅ Aligned  | `Group` (case-insensitive) → `TalkGroup`; everything else → `Contact`.                                                                                                                                                                            |
| `detectKind` heuristics                      | ✅ Aligned  | Filename-first, then header signatures; `DTMF.csv` correctly excluded from contacts.                                                                                                                                                              |
| Skip vs error (DTMF/APRS)                    | ✅ Aligned  | Not imported; exported header-only. Tracked in [outstanding](../import-export/outstanding.md).                                                                                                                                                    |
| Cardinality (80 zone / 32 TG list)           | ⚠️ Drift   | Export columns hard-coded to 80/32 via `zoneMemberHeaders()`/`rxGroupListMemberHeaders()` defaults — **not** named `OPENGD77_MAX_`* constants. Zone export **silently drops** members beyond 80 (no warning); TG list truncation at 32 is tested. |
| Lossy fields (`vendorExtras`, `hideFromMap`) | ✅ Aligned  | `hideFromMap` preserved across merge; `vendorExtras` round-trips the documented OpenGD77-only columns.                                                                                                                                            |
| Merge semantics                              | ✅ Aligned  | Name-keyed merge, last-row-wins dedupe, zone re-resolution against post-merge channels. Matches the hub README.                                                                                                                                   |
| Schema version in docs                       | ❌ Drift    | [persistence README](../persistence/README.md) still says `CODEPLUG_SCHEMA_VERSION = 1`; actual is **3**. Fix doc.                                                                                                                                |
| `Channel.number` framing                     | ❌ Leak     | Documented as `OpenGD77 Channel Number`, stored and round-tripped verbatim. Should be export-assigned (#53).                                                                                                                                      |


**Follow-up tickets suggested by the audit:**

- **A — zone export truncation is silent.** Members beyond 80 are dropped with no warning, unlike TG list truncation (tested). Add an export warning and a test. (Export-boundary bug.)
- **B — `rxOnly` boolean inconsistency.** Either normalise to `boolean` at import (preferred, folds into #52) or document why it stays a string while the other Yes/No fields don't.
- **C — persistence doc says schema v1.** Trivial doc fix.

These are small enough to fold into the #52/#53 implementation PRs rather than standalone issues, but should be ticked off explicitly.

---

## 2. Channel field rationalisation (#52)

Every `Channel` field below, its current storage, the OpenGD77 wire example it carries, and the **proposed vendor-neutral internal representation**. Vendor-specific strings that have no neutral home stay in import/export mappers (or `vendorExtras`), not the model.


| Field                                   | Today (model)           | Wire example             | Proposed internal type                                                                | Boundary mapping                                                               |
| --------------------------------------- | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `power`                                 | `string`                | `Master`, `P2`, `P4`     | percentage. null=master. `number`                                                     | OpenGD77 map `low→P2`, `max→Master`, etc. Keep the wire ladder in the adapter. |
| `bandwidthKHz`                          | `string`                | `12.5`, `25`             | `number` (kHz)                                                                        | Parse on import; serialise `12.5`/`25`.                                        |
| `colourCode`                            | `string`                | `2`                      | `number` (0–15) or `null`                                                             | DMR-only (see §4). Validate range at export.                                   |
| `timeslot`                              | `string`                | `1`, `2`                 | enum `1                                                                               | 2                                                                              |
| `squelch`                               | `string`                | `75%`, `Disabled`        | percentage. 0=open/no squelch, 100=closed. null=master.                               | Map to OpenGD77 strings at export.                                             |
| `rxOnly`                                | `string` (`Yes`/`No`)   | `Yes`                    | `boolean`                                                                             | `wireYesNo` already exists; just convert at import (fixes audit B).            |
| `rxTone` / `txTone`                     | `string`                | `None`, `103.5`, `D023N` | String enum, union of CTCSS and DCS values.                                           | Analogue-relevant; primary for CHIRP.                                          |
| `transmitTimeout`                       | `string`                | `0`                      | `number` seconds (0–495) or `null`                                                    | Validate range at export.                                                      |
| `dmrId`                                 | `string`                | `''`, `1234567`          | `number                                                                               | null`                                                                          |
| `rxFrequency` / `txFrequency`           | `string`                | `145.500`                | **Number, in Hz to avoid rounding issues. Shouldn't overflow common DB int formats.** |                                                                                |
| `voxEnabled`, `scanSkip`, `useLocation` | `boolean`               | —                        | ✅ already neutral                                                                     | —                                                                              |
| `mode`                                  | `ChannelMode`           | `Digital`/`Analogue`     | ✅ already neutral                                                                     | —                                                                              |
| `name`, `callsign`                      | `string`                | —                        | ✅ display/derived                                                                     | —                                                                              |
| `contactName`, `rxGroupListName`        | `string` (FK by name)   | —                        | keep name-FK at boundary (see §3)                                                     | —                                                                              |
| `aprsConfigName`                        | `string` (FK by name)   | `None`                   | keep; APRS body not modelled (outstanding)                                            | —                                                                              |
| `location`, `hideFromMap`               | typed                   | —                        | ✅ neutral / app-only                                                                  | —                                                                              |
| `vendorExtras`                          | `Record<string,string>` | —                        | ✅ escape hatch                                                                        | —                                                                              |
| `number`                                | `string`                | `1`                      | **remove** (see §5)                                                                   | —                                                                              |


**Principles for #52 work:**

- Each field is a **decision + doc + model + migration + import + export + UI** slice (per the ticket's per-field deliverable list). Prefer atomic commits per field/group.
- Where a value is domain knowledge (power ladders, tone codes), add a `docs/reference/` entry rather than inlining the mapping table in code comments.
- UI controls must follow the type: `Select`/`NumberInput`/`Checkbox` rather than `TextInput`. Today the edit form uses free-text `TextInput` for `power`, `bandwidthKHz`, `colourCode`, `timeslot`, `squelch`, `rxOnly`, `transmitTimeout`, tones, and `dmrId` (`src/routes/channels/edit.tsx`).
- Values with no neutral equivalent stay in `vendorExtras` or live only in the adapter — never reject/cap in CRUD because export might not round-trip.

---

## 3. Foreign keys and entity shape

Name-based FKs are a deliberate boundary concession, but they are worth restating as the model generalises:

- `Channel.contactName`, `Channel.rxGroupListName`, `RxGroupList.sourceMemberNames`, `Zone.sourceMemberNames` all reference other entities **by vendor name**, not internal id. Zones additionally hold resolved `memberChannelIds`.
- This is correct for round-trip fidelity but couples the model to case-sensitive name uniqueness. Document the invariant clearly; do not "fix" it into id-only references without preserving export round-trip.
- `TalkGroup` vs `Contact` split mirrors OpenGD77's single `Contacts.csv` + `ID Type` column. The split is reasonable internally, but the kind must be re-synthesised on export to any format with a unified contact table.

No change required for #52/#53 — flagged so later format work (DM32, qDMR, CHIRP) does not assume id-based references.

---

## 4. Mode-applicability (DMR-centric entity set)

The model presents DMR concepts as universal: `colourCode`, `timeslot`, `dmrId`, `TalkGroup`, `RxGroupList`, and contact FKs all assume DMR. An **analogue-only format like CHIRP** has none of these — its primary fields are CTCSS/DCS tones.

Recommendation (pairs with mode-enum work #45/#48):

- Treat DMR fields as **mode-applicable**, not universal. The edit form already gates DMR/analogue sections on mode (`showDmrFields`, `showAnalogFields`); the *model* should express the same intent (e.g. nullable typed fields that are `null` when not applicable, rather than empty strings).
- Use CHIRP as the litmus test: any typed representation that only "works" for OpenGD77/DM32 (both DMR) still carries DMR assumptions.

This is a structural decision to make **alongside** #52's field typing, since the type of e.g. `colourCode` (`number | null`) encodes applicability.

---

## 5. Drop `Channel.number` (#53)

`Channel.number` maps to OpenGD77 `Channel Number` (1–1023, direct-access in the radio's All-channels zone). It is a CPS slot index with no neutral meaning and does not generalise (DM32 uses `No.` with different rules).

**Required edits (ordered, atomic-commit-friendly):**

1. **Model** — remove `number` from `Channel` and `channelFieldDefaults()` (`src/models/codeplug.ts`).
2. **Schema** — bump `CODEPLUG_SCHEMA_VERSION` to 4; in `migrateChannel` (`src/state/codeplugStorage.ts`) discard persisted `number` (re-derived at next export). Add a v3→v4 fixture to `codeplugStorage.test.ts`.
3. **Import** — stop mapping `Channel Number` → `number` in `parse.ts`/`columns.ts` (discard; do not stash in `vendorExtras`).
4. **Export** — assign `Channel Number` in `serialise.ts` at serialise time: sequential `1…n` in channel-list order. Respect OpenGD77 constraints (1–1023, unique); surface an export warning if channel count exceeds the limit. Document the assignment rule.
5. **Merge equality** — remove `a.number === b.number` from `channelsImportEqual` (`src/lib/importEntityCompare.ts`).
6. **UI** — remove the "Channel number" `TextInput` from `edit.tsx`, the Identity field from `detail.tsx`. (`list.tsx` does not reference it.)
7. **Tests/fixtures** — drop `number` from channel fixtures across `parse.test.ts`, `importMerge.test.ts`, `codeplugMutations.test.ts`, `validation.test.ts`, `channels.test.ts`, `codeplug.test.ts`, `reportLookup.test.ts`, `codeplugStore.test.tsx`, `codeplugProject.test.ts`.
8. **Docs** — update [data-model README](README.md), import/export mapping tables, and the [OpenGD77 channels reference](../../reference/opengd77/channels.md).

Note: `Contact.number` and `TalkGroup.number` are **DMR IDs**, unrelated to `Channel.number` — leave them.

This change is **independent** of #52 and can land first as a focused PR.

---

## 6. Remove vendor cardinality from CRUD

**Status (2026-06):** Resolved in [#132](https://github.com/pskillen/codeplug-tool/issues/132) — cap removed from mutations/validation/UI; `collectOpenGd77ExportWarnings` warns at export.

Previously, `OPENGD77_MAX_ZONE_MEMBERS = 80` (`src/lib/codeplugMutations.ts`) was enforced in:

- `addZone` / `setZoneMembers` — throws on > 80 members,
- `validateZone` (`src/lib/validation/zone.ts`) — validation error,
- `ZoneMemberPicker.tsx` — UI cap and `n / 80` counter.

This is the documented anti-pattern from [AGENTS.md](../../../AGENTS.md): radio limits belong **only** at export. RX group lists already follow the correct pattern (no member cap in CRUD; export truncates at 32).

**Required edits:**

1. Remove `OPENGD77_MAX_ZONE_MEMBERS` from mutations and validation; CRUD accepts unlimited zone members.
2. Move the cap to the export boundary — truncate (or warn) zone members at the active radio variant's limit during `serialiseZones`, matching the TG list pattern. (Also fixes audit finding A — make truncation explicit/warned.)
3. UI: drop the hard cap; optionally show an advisory ("exceeds 1701's 80-member limit") sourced from the export profile, not a CRUD constraint.

This depends on the radio-variant-at-export design ([#72](https://github.com/pskillen/codeplug-tool/issues/72)) for where the limit constant should live; until then, keep the 80 as an export-only constant in the OpenGD77 adapter.

---

## 7. Open questions for the plan

1. **Frequencies** — `number` MHz vs `string`? String avoids float precision/formatting churn and is fine for round-trip; numeric enables validation and band logic. Decide explicitly (separate from #52's other fields).
2. **MVP scope** — per [format-taxonomy](../import-export/format-taxonomy.md), the near-term goal is *one radio nailed end-to-end*, not full genericisation. Recommend: do **#53** (drop number) and **#52** field typing + **§6** (CRUD cardinality) now; defer full analogue/CHIRP support and multi-format export until after the first complete loop. §4 mode-applicability should be designed now (it shapes field types) but only OpenGD77-relevant modes implemented.
3. `**squelch` representation** — needs a domain decision (percent vs level vs structured); add a `docs/reference/` entry.

---

## Summary of required changes


| #   | Change                                                                                                         | Ticket          | Independent?     |
| --- | -------------------------------------------------------------------------------------------------------------- | --------------- | ---------------- |
| 1   | Drop `Channel.number`; assign at export                                                                        | #53             | ✅ land first     |
| 2   | Type `power`, `bandwidthKHz`, `colourCode`, `timeslot`, `squelch`, `rxOnly`, tones, `transmitTimeout`, `dmrId` | #52             | per-field        |
| 3   | Make DMR fields mode-applicable (nullable typed)                                                               | #52 / #45 / #48 | with #2          |
| 4   | Move `OPENGD77_MAX_ZONE_MEMBERS` out of CRUD/validation to export                                              | #91 / #72       | after #72 design |
| 5   | Warn (not silently drop) on zone export truncation                                                             | #91 (A)         | small            |
| 6   | Normalise `rxOnly` to boolean                                                                                  | #91 (B) / #52   | with #2          |
| 7   | Fix persistence doc schema version (1 → 3/4)                                                                   | #91 (C)         | trivial          |
| 8   | Schema bump + migration for the above                                                                          | #52 / #53       | per change       |


---

## Related

- [Data model (canonical)](README.md)
- [Formats, variants, and the vendor-neutral model](../import-export/format-taxonomy.md)
- [OpenGD77 wire reference](../../reference/opengd77/README.md) · [channels](../../reference/opengd77/channels.md)
- [OpenGD77 radio profiles](../../reference/opengd77/radios/README.md)
- [Import / export hub](../import-export/README.md) · [outstanding](../import-export/outstanding.md)
- Issues: [#91](https://github.com/pskillen/codeplug-tool/issues/91) (audit), [#52](https://github.com/pskillen/codeplug-tool/issues/52) (typed fields), [#53](https://github.com/pskillen/codeplug-tool/issues/53) (drop channel number), [#72](https://github.com/pskillen/codeplug-tool/issues/72) (variant picker)

