# Import / export fidelity contract

**What an operator may expect to be preserved when a codeplug crosses an import or export boundary — and what we deliberately do not promise.** This is the authoritative statement of intent for every import and export adapter and for the tests that guard them. Format-specific column behaviour lives under [`docs/reference/<vendor>/`](../../reference/opengd77/README.md); test mechanics live in [format-fidelity.md](../../build/testing/format-fidelity.md). This document defines the *contract* those satisfy.

Related foundations:

- [AGENTS.md — Round-trip fidelity](../../../AGENTS.md#round-trip-fidelity)
- [No wire stash for round-trip](../../../.cursor/rules/no-wire-stash-roundtrip.mdc)
- [Data model](../data-model/README.md) — the internal source of truth
- [Import / export hub](README.md)

---

## First principle: the internal model is the source of truth

Every format converts through the radio- and vendor-agnostic [internal codeplug model](../data-model/README.md). Import parses a vendor file **into** the model; export serialises **from** the model. Between those two steps the model is authoritative — including for entities the operator created or edited in the app, which have no import provenance at all.

This has one decisive consequence that governs the whole contract:

> **We guarantee fidelity of *meaning*, not fidelity of *bytes*.**

The thing we promise to carry across a boundary is the operator's **intent** as captured in the internal model: which channels exist, what they transmit, which talk groups and lists they reference, how zones group them. We do **not** promise to reproduce the exact text, column order, row order, or redundant encodings of whatever file happened to be imported.

A file produced by exporting the model is the **canonical** representation of that model in the target format. An arbitrary third-party CPS file is **an** input we do our best to understand — not a golden output we are obliged to recreate verbatim.

---

## Import normalises; that is a feature

Import is allowed — and often required — to **canonicalise** as it converts. Vendor files frequently encode the same intent in several ways, carry vendor-specific modelling we deliberately strip, or contain redundancy (duplicate entities, denormalised relationships) that the internal model represents once. Import collapses these into the single canonical internal form.

| Import behaviour | Status |
| --- | --- |
| Strip vendor-specific modelling that the internal model expresses differently | **Expected** |
| Collapse redundant or duplicated wire entities into one logical entity | **Expected** |
| Move a relationship from where the vendor stored it to where the model stores it | **Expected** |
| Resolve name-based wire references to internal id foreign keys | **Expected** |
| Preserve the operator's substantive intent (RF, references, grouping) | **Required** |
| Reproduce the vendor file's exact entity count or layout internally | **Not a goal** |

Because import normalises, the model after import may be **structurally simpler** than the file that produced it. That is correct. The test of a good importer is whether the *meaning* survived, not whether the file could be reconstructed character-for-character.

---

## Export serialises from the model, never replays the import

Export derives every wire value from typed model fields plus **boundary rules** that are mode-, vendor-, and profile-aware. It must produce a file the target CPS accepts and that re-imports to the same logical model.

Export must **not** fake fidelity by stashing raw imported column strings and replaying them. This is a [critical rule](../../../.cursor/rules/no-wire-stash-roundtrip.mdc): stash-and-replay hides lossy mappers, ignores operator edits, and fails entirely for in-app-created entities. `meta.imported` is not an export layer. The only sanctioned opaque carry-through is the explicitly documented, legacy `opengd77Extras` escape hatch for OpenGD77-only columns not yet promoted to first-class fields.

When the model cannot produce a column faithfully, the answer is to **extend the model and fix the mapper**, or to **document the column as lossy** — never to overlay the original bytes.

---

## The fidelity tiers

Fidelity is layered. Each tier is a distinct promise with a distinct test obligation.

| Tier | Promise | Strength |
| --- | --- | --- |
| **1. Import fidelity** | Each vendor row maps to the correct internal entity and fields; substantive intent is preserved | **Guaranteed** |
| **2. Export validity** | Exported files are well-formed and accepted by the target CPS within its declared profile limits | **Guaranteed** |
| **3. Semantic round-trip** | model → export → re-import yields the **same logical model** (ignoring ids and other non-semantic detail) | **Guaranteed** |
| **4. Cross-format** | model imported from format A, exported to format B, preserves everything both formats can express | **Guaranteed for the shared subset; lossy outside it** |
| **5. Byte/file reproduction** | An imported third-party file is re-emitted character-for-character | **Explicitly NOT guaranteed** |

### Tier 1 — Import fidelity (guaranteed)

The operator's design, as expressed in a vendor file, lands correctly in the model: RF parameters, references between entities, grouping, and per-entity attributes. Parse by **header name**, never column index. Report unparseable rows in `ImportResult.errors`; report skipped files in `skipped`. Where a format keeps case-sensitive name foreign keys, preserve case exactly at the boundary.

### Tier 2 — Export validity (guaranteed)

Whatever the model contains, the exported file is structurally valid and importable by the target CPS for the selected radio profile. Cardinality caps, truncation, name shortening, and profile-specific serialisation rules are applied **here, at the boundary** — never baked into the internal model, validation, or CRUD. Where a profile limit forces a drop or truncation, surface it as an export warning.

### Tier 3 — Semantic round-trip (guaranteed)

This is the **canonical** round-trip promise: take a model, export it, re-import the result, and the re-imported model must equal the original up to non-semantic detail. This proves the import and export mappers are mutually consistent and that no meaning leaks at either edge. It is asserted on **substantive model equality**, not file text (see [What we let slip](#what-we-deliberately-let-slip)).

A useful corollary: re-importing a file the app itself exported is **idempotent** — it is a no-op merge that changes nothing.

### Tier 4 — Cross-format (guaranteed for the shared subset)

Converting from one format to another preserves everything both formats can represent. Concepts one format supports and the other lacks are dropped or adapted at the target boundary, and the loss is documented in the target's reference docs. No format may shape the internal model to its own convenience at the expense of another.

### Tier 5 — Byte/file reproduction (explicitly not guaranteed)

We do **not** promise that importing an arbitrary vendor file and immediately exporting it reproduces that file. This falls out of every principle above: import normalises, export serialises canonically from the model, and many vendor files carry redundancy or alternative encodings the model unifies. An operator who imports a hand-built file and re-exports it should expect a **clean, canonical** equivalent — not a clone.

---

## What we deliberately let slip

These differences between an imported file and a subsequent export are **by design**. None is a defect.

| Slippage | Why it is acceptable |
| --- | --- |
| **Byte / character identity** | Meaning is the contract, not text |
| **Column and row ordering** | Serialisers emit a canonical layout; order carries no meaning |
| **Whitespace, line endings, trailing newline** | Cosmetic; normalised for any file-level compare |
| **Redundant or alternative wire encodings** | Import unifies them to one canonical model form; export emits one canonical encoding |
| **Duplicated wire entities collapsed on import** | The model holds one logical entity; export may re-expand differently than the original duplicated layout |
| **Relationship moved to its canonical model home** | The vendor's storage location is not preserved when the model stores the relationship elsewhere |
| **Internal ids** | Generated, not meaningful; reassigned freely and stripped from semantic compares |
| **Export-assigned positional values** (e.g. sequential row numbers) | Derived at export from list order, not stored in the model |
| **Naming style applied at export** (shortening, suffix conventions, disambiguation) | A boundary concern; the canonical name may differ from the imported string |
| **Vendor modelling stripped at import** | The internal model expresses the concept differently; the vendor encoding is re-derived, not echoed |
| **Header-only / unmodelled files** | Files the model does not represent are skipped on import and emitted as headers only |
| **Fields with no neutral equivalent** | Documented as lossy in the vendor reference; not faked via wire stash |

The unifying rule: **anything that does not change the operator's substantive intent may change across a boundary.** If a slippage *would* change intent, it is a bug, not acceptable loss.

---

## How the tiers are tested

Tests exist to guard the tiers above and nothing more; mechanics and file locations live in [format-fidelity.md](../../build/testing/format-fidelity.md). The contract imposes these obligations:

| Tier | Test obligation | Assertion style |
| --- | --- | --- |
| 1 Import fidelity | Unit tests on parsers (column → field); adapter classification tests; multi-file assembly | Field-level equality on mapped entities |
| 2 Export validity | Unit tests on serialisers (field → column); profile cap/truncation/warning tests | Column values and warnings; valid structure |
| 3 Semantic round-trip | Adapter integration: import → export → re-import | **Model equality up to ids and non-semantic detail** |
| 4 Cross-format | Adapter-matrix tests for each shipped import × export pair | Shared-subset equality; documented loss elsewhere |
| 5 Byte reproduction | *None* — not a promise, so not asserted | — |

### Assert intent, not text

Round-trip and cross-format tests assert on the **internal model**, not on file bytes. Compare the model after a round-trip to the model before it, ignoring ids and other [deliberately slipped](#what-we-deliberately-let-slip) detail. Do not assert that an export reproduces an imported file.

Where a file-level comparison is genuinely useful (for example, proving a serialiser is stable, or in browser e2e), it must:

- normalise ordering, whitespace, and line endings first;
- exclude columns the model deliberately re-derives or does not store;
- compare **semantically equivalent** values rather than raw strings where a format admits more than one spelling of the same meaning (apply a normaliser).

Critically — per the [no-wire-stash rule](../../../.cursor/rules/no-wire-stash-roundtrip.mdc) — a file-level test must pass from **model serialisation alone**. Excluding export-reassigned columns is fine; passing only because the import file was replayed is not.

### Real-world files are import torture tests, not export goldens

A large, messy, real operator export is extremely valuable as a **Tier 1 + Tier 3** fixture: it proves the importer survives genuine input at scale and that the resulting model round-trips. It is **not** a Tier 5 golden snapshot. Assert that such a fixture imports to a sane model and that model → export → re-import is stable — never that the exporter reproduces the original file. When a real file uses an encoding the importer normalises, the canonical export will legitimately differ from it.

A small, hand-authored fixture already in canonical form is the right tool when you want tight, readable assertions on exact wire output.

---

## Applying this contract to a new or changed adapter

1. **Map at the boundary.** Wire → typed model fields on import; model fields → wire on export, with mode-, vendor-, and profile-aware rules. Never branch export on `meta.imported.*`.
2. **Normalise deliberately.** Decide and document what the importer canonicalises (collapsed entities, stripped vendor modelling, relocated relationships). Treat that as expected behaviour, not loss to apologise for.
3. **Model the field or document the loss.** If a column carries real intent, add a typed model field and a mapper. If it does not, record it as lossy in the vendor reference and in tests. Do not stash-and-replay.
4. **Guard the tiers.** Add Tier 1 parser tests, Tier 2 serialiser/profile tests, and a Tier 3 semantic round-trip. Fill the adapter-fidelity matrix for any cross-format pair.
5. **Choose fixtures by purpose.** Hand-authored canonical fixtures for exact wire assertions; real-world exports for import-survival and semantic round-trip — never as byte goldens.
6. **State the slippage.** List the format's acceptable losses in its reference doc so operators and future contributors know what the boundary intentionally drops or re-derives.

---

## Related

- [Import / export hub](README.md)
- [Format fidelity testing](../../build/testing/format-fidelity.md)
- [Data model](../data-model/README.md)
- [No wire stash for round-trip](../../../.cursor/rules/no-wire-stash-roundtrip.mdc)
- [AGENTS.md — Round-trip fidelity](../../../AGENTS.md#round-trip-fidelity)
