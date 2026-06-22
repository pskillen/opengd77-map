# Adding a new vendor format

Checklist for contributors adding a CPS import/export format to codeplug-tool. The internal [codeplug model](../data-model/README.md) is the hub — vendor specifics are applied on import and stripped or constrained on export.

**Reference implementation:** OpenGD77 ([adapter docs](opengd77/README.md), [`src/lib/import/opengd77/`](../../../src/lib/import/opengd77/), [`src/lib/export/opengd77/`](../../../src/lib/export/opengd77/)).

---

## When to add

| Situation | What to build |
| --- | --- |
| **New vendor format** (e.g. DM32 CPS CSV, qDMR YAML) | New import adapter, export adapter, reference docs, fixture bundle, UI format entry |
| **New radio on existing format** (e.g. another OpenGD77 radio) | Reference [radio profile](../../reference/opengd77/radios/README.md) only — export limits at profile picker ([#72](https://github.com/pskillen/codeplug-tool/issues/72)); adapter stays format-level |

Do **not** bake radio profile caps into internal models, mutations, validation, or CRUD UI. See [AGENTS.md Vendor boundaries](../../../AGENTS.md#vendor-boundaries).

---

## 1. Reference docs

Ground truth for wire-format columns and conversion rules lives under `docs/reference/<vendor>/`, separate from adapter behaviour docs under `docs/features/import-export/<vendor>/`.

- [ ] Create `docs/reference/<vendor>/README.md` hub with file list, FK rules, skip-vs-error table
- [ ] One page per CPS file or logical grouping (channels, zones, contacts, etc.)
- [ ] Document **lossy fields** (header-only files, columns not modelled, `vendorExtras` survival)
- [ ] If one format serves many radios, add `docs/reference/<vendor>/radios/` for per-radio limits
- [ ] Cite ground-truth sources (vendor CPS exports, community docs, reverse-engineered samples)

OpenGD77 example: [reference/opengd77/](../../reference/opengd77/README.md) + [radio profiles](../../reference/opengd77/radios/README.md).

---

## 2. Code layout

```
src/lib/import/<vendor>/
  adapter.ts      # detectKind, id, delegates to parse
  parse.ts        # wire row → internal entities
  columns.ts      # header constants (shared with export)
  parse.test.ts   # column → field unit tests

src/lib/export/<vendor>/
  adapter.ts      # id, serialise entry points
  serialise.ts    # internal entity → wire columns
  roundtrip.test.ts   # import → export → re-import compare

src/test/<vendor>/
  bundles.ts      # synthetic CSV/YAML maps keyed by filename
  loadFixture.ts  # loadFixture(bundle) → File[]
```

Registration:

- [ ] Add import adapter to [`src/lib/import/registry.ts`](../../../src/lib/import/registry.ts)
- [ ] Add export adapter to [`src/lib/export/registry.ts`](../../../src/lib/export/registry.ts)
- [ ] Add format option to [`src/lib/vendorFormats.ts`](../../../src/lib/vendorFormats.ts) (`importStatus` / `exportStatus`)
- [ ] Extend `VendorFormatId` and `parseVendorFormatId` in [`useVendorFormatParam.ts`](../../../src/hooks/useVendorFormatParam.ts) if needed

Adapter contract (import): implement `detectKind(fileName, headerRow)`, parse functions returning internal entities or raw intermediate shapes, report skipped files and parse errors via `ImportResult`, and set `projectNameLabel` (short string for default new-project names: `{projectNameLabel} YYYY-MM-DD` when the user did not pick a folder).

Adapter contract (export): serialise `Codeplug` to per-file downloads and/or ZIP bundle; apply radio profile limits at this layer when a profile is selected.

---

## 3. Data model

Extend the internal model only when a field is **shared across vendors** or needed for app features (map, CRUD, reports).

| Extend `Codeplug` entities | Use `vendorExtras` or opaque wire strings |
| --- | --- |
| Channel mode, frequency, contact ref, zone membership | Vendor-specific column not mapped to a first-class field |
| Talk group, contact, RX group list semantics | Columns that round-trip but have no UI yet |

- [ ] Read [data-model/README.md](../data-model/README.md) before adding fields
- [ ] Bump schema version + migration if entity shape changes
- [ ] Preserve **internal FK rules**: wire-name uniqueness where channels resolve contacts or RX lists by name; case-sensitive channel names (OpenGD77)
- [ ] Do not cap entity counts in mutations — defer to export with warnings/truncation

---

## 4. Tests

Follow [format-fidelity.md](../../build/testing/format-fidelity.md). Every import/export change should cover applicable scenarios:

| Scenario | Layer | Required for new vendor |
| --- | --- | --- |
| Import fidelity | Unit beside `parse.ts` | Yes |
| Export fidelity | Unit beside `serialise.ts` | Yes |
| Same-format round-trip | `roundtrip.test.ts` | Yes |
| Re-import / merge | System (`importMerge.test.ts`, `runActiveImportWorkflow`) | When merge interaction matters |
| Cross-format | Adapter matrix golden | When second vendor ships |
| Lossy fields | Reference + fidelity assert | Document + test header-only / skipped files |

Checklist:

- [ ] Parse by **header name**, never column index
- [ ] Add committed synthetic bundle under `src/test/<vendor>/` — see [fixtures.md](../../build/testing/fixtures.md)
- [ ] `roundtrip.test.ts`: deterministic ids via `setIdGenerator`; `stripIds()` before semantic compare
- [ ] Fill a row/column in the adapter fidelity matrix in format-fidelity.md
- [ ] System test via [`runActiveImportWorkflow`](../../../src/test/system/importWorkflow.ts) for multi-file batch scenarios

```bash
npm run test              # unit + round-trip
npm run test:system       # merge workflow harness
```

---

## 5. UI

Import/export UI is format-aware via `useVendorFormatParam` (`?format=` query param).

| Component | Role |
| --- | --- |
| [`ImportDropzone`](../../../src/components/ImportDropzone/ImportDropzone.tsx) | Home — creates new project from import |
| [`ImportIntoActivePanel`](../../../src/components/ImportIntoActivePanel/ImportIntoActivePanel.tsx) | Import & export page — merge/overwrite into active project |
| [`ExportFromActivePanel`](../../../src/components/ExportFromActivePanel/ExportFromActivePanel.tsx) | Per-file + ZIP download |
| [`ImportExportSectionNav`](../../../src/components/SectionNav/sections/ImportExportSectionNav.tsx) | Secondary nav ([#81](https://github.com/pskillen/codeplug-tool/issues/81)) |

- [ ] Wire format selector to `vendorFormats.ts` capabilities
- [ ] Show "coming soon" for planned formats until adapters ship
- [ ] Classification: adapter `detectKind` must handle typical CPS filenames and header-only detection
- [ ] Confirm modal for active import shows merge stats (added/updated/removed/unchanged)

---

## 6. Lossy fields

Document and test known non-round-trip behaviour:

- [ ] Skipped files on import (e.g. DTMF/APRS for OpenGD77)
- [ ] Header-only export for unmodelled files
- [ ] App-only fields preserved on merge but absent from CSV (e.g. `hideFromMap`)
- [ ] `vendorExtras` opaque column round-trip
- [ ] Add open items to [outstanding.md](outstanding.md)

---

## 7. Feature docs to update

- [ ] `docs/features/import-export/README.md` — implementation status row
- [ ] `docs/features/import-export/<vendor>/README.md` — adapter behaviour (not column tables)
- [ ] `docs/features/README.md` — index row if new top-level vendor subtree
- [ ] `docs/build/testing/format-fidelity.md` — fidelity matrix row/column
- [ ] `docs/build/testing/fixtures.md` — bundle layout if new pattern
- [ ] [`AGENTS.md`](../../../AGENTS.md) — repository layout table if warranted
- [ ] Component sidecars if UI behaviour changes (`ImportIntoActivePanel.md`, etc.)

---

## 8. Cross-format (when two vendors ship)

The internal model is the hub:

```
FormatA → import → Codeplug → export → FormatB
```

- [ ] Add cross-format golden test: import FormatA fixture → export FormatB → assert expected fields
- [ ] Document expected loss at each boundary in reference docs
- [ ] Optional: import FormatB → export FormatA round-trip subset

Until a second vendor ships, document the pattern only (see format-fidelity matrix).

---

## 9. Manual verify

End-to-end smoke test before PR:

1. `npm run dev`
2. Import a sample folder (home or active project)
3. Touch data via CRUD (rename channel, add zone member)
4. Export per-file or ZIP
5. Re-import exported files — merge should show expected deltas
6. Hard refresh — LocalStorage persistence intact

Use `sample-exports/` locally (gitignored); committed fixtures in `src/test/<vendor>/` for CI.

---

## Worked example: OpenGD77

Use this as a walk-through when adding DM32, qDMR, or another format.

| Step | OpenGD77 location |
| --- | --- |
| Reference hub | `docs/reference/opengd77/README.md` |
| Radio profiles | `docs/reference/opengd77/radios/baofeng-1701.md` |
| Adapter behaviour | `docs/features/import-export/opengd77/README.md` |
| Import adapter | `src/lib/import/opengd77/adapter.ts`, `parse.ts`, `columns.ts` (`projectNameLabel: 'OpenGD77'`) |
| Export adapter | `src/lib/export/opengd77/adapter.ts`, `serialise.ts` |
| Registries | `src/lib/import/registry.ts`, `src/lib/export/registry.ts` |
| UI format | `src/lib/vendorFormats.ts` — `id: 'opengd77'`, both shipped |
| Fixtures | `src/test/opengd77/bundles.ts`, `loadFixture.ts` |
| Round-trip | `src/lib/export/opengd77/roundtrip.test.ts` |
| System harness | `src/test/system/importWorkflow.ts`, `activeImport.system.test.ts` |
| Outstanding debt | APRS/DTMF not modelled — [outstanding.md](outstanding.md) |

OpenGD77 teaches the **format vs profile** split: one CSV adapter, many radio profiles at export time.

---

## Related

- [Import / export hub](README.md)
- [Format fidelity](../../build/testing/format-fidelity.md)
- [Fixtures](../../build/testing/fixtures.md)
- [Data model](../data-model/README.md)
- [Outstanding debt](outstanding.md)
