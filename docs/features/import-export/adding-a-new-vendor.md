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

### Round-trip fidelity (no wire stash)

Import maps CPS wire values into the **internal model**; export serialises **from model fields** only. The model must round-trip columns that matter — including for channels created in the app, not only re-exports of imports.

**Forbidden:** stashing raw wire cells in provenance/meta (e.g. `meta.imported.wireColumns`) and preferring them on export to pass round-trip tests. That is stash-and-replay, not conversion. If fidelity fails, add or fix first-class fields and boundary mappers, or document the column as lossy in reference docs.

**Do not add** new per-format wire bags (`chirpExtras`, `wireColumns`, …) for round-trip. Legacy `opengd77Extras` is the only approved opaque escape — prefer modelling fields instead. See [AGENTS.md — Round-trip fidelity](../../../AGENTS.md#round-trip-fidelity) and [`.cursor/rules/no-wire-stash-roundtrip.mdc`](../../../.cursor/rules/no-wire-stash-roundtrip.mdc).

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

### Shared adapter contracts

Future formats implement typed interfaces in [`src/lib/import-export/`](../../../src/lib/import-export/):

| File | Role |
| --- | --- |
| `types.ts` | `VendorFormatId`, `ImportAdapterCapabilities`, `ExportOptions`, `ExportResult` |
| `importAdapter.ts` | `ImportAdapter` interface + `adapterSupportsKind()` |
| `exportAdapter.ts` | `ExportAdapter` union (`MultiFileExportAdapter` \| `SingleFileExportAdapter`) + type guards |
| `registry.ts` | `importAdapters`, `exportAdapters`, `getImportAdapter`, `getExportAdapter`, `detectImportAdapter` |
| `adapterContract.test.ts` | Assert each shipped adapter satisfies its interface |

Adapters use `satisfies ImportAdapter` / `satisfies MultiFileExportAdapter` / `satisfies SingleFileExportAdapter` — do not pass vendor shapes through to the internal model.

### Delivery variants

| `delivery` | Import | Export | UI |
| --- | --- | --- | --- |
| `multi-file` | Folder or loose CSV batch (OpenGD77) | Per-file + ZIP | `isMultiFileExportAdapter` — one button per `fileNames` entry + ZIP |
| `single-file` | One memory CSV (CHIRP) | One CSV download | `isSingleFileExportAdapter` — profile picker when `ExportOptions.profileId` applies |

### Per-format directories

```
src/lib/import-export/     # shared contracts + registry (above)
src/lib/import/<vendor>/
  adapter.ts      # detectKind, id, capabilities, satisfies ImportAdapter
  parse.ts        # wire row → internal entities
  columns.ts      # header constants (shared with export)
  parse.test.ts   # column → field unit tests

src/lib/export/<vendor>/
  adapter.ts      # id, delivery, satisfies ExportAdapter variant
  serialise.ts    # internal entity → wire columns (+ warnings)
  roundtrip.test.ts   # import → export → re-import compare

src/test/<vendor>/
  bundles.ts      # synthetic CSV/YAML maps keyed by filename
  loadFixture.ts  # loadFixture(bundle) → File[] (optional)
```

Registration:

- [ ] Add import adapter to [`src/lib/import-export/registry.ts`](../../../src/lib/import-export/registry.ts) (re-exported from [`src/lib/import/registry.ts`](../../../src/lib/import/registry.ts))
- [ ] Add export adapter to the same shared registry (re-exported from [`src/lib/export/registry.ts`](../../../src/lib/export/registry.ts))
- [ ] Add format option to [`src/lib/vendorFormats.ts`](../../../src/lib/vendorFormats.ts) — import `VendorFormatId` from `import-export/types.ts`
- [ ] Whitelist format id in [`useVendorFormatParam.ts`](../../../src/hooks/useVendorFormatParam.ts) if needed

Adapter contract (import): implement `detectKind(fileName, headerRow)`, `capabilities`, parse functions returning internal entities, report skipped files and parse errors via `ImportResult`, set `result.formatId`, and set `projectNameLabel` (short string for default new-project names: `{projectNameLabel} YYYY-MM-DD` when the user did not pick a folder).

Adapter contract (export): implement `delivery`; multi-file adapters expose `downloadFile` / `downloadZip`; single-file adapters expose `download(ctx) → ExportResult` with `warnings`. Apply radio profile limits at this layer when a profile is selected (`ExportOptions.profileId`).

---

## 3. Data model

Extend the internal model only when a field is **shared across vendors** or needed for app features (map, CRUD, reports).

| Extend `Codeplug` entities | Use `vendorExtras` or opaque wire strings |
| --- | --- |
| Channel mode, frequency, contact ref, zone membership | Vendor-specific column not mapped to a first-class field |
| Talk group, contact, RX group list semantics | Columns that round-trip but have no UI yet |

- [ ] Read [data-model/README.md](../data-model/README.md) before adding fields
- [ ] Round-trip via **model fields**, not wire stash — see [Round-trip fidelity](#round-trip-fidelity-no-wire-stash) above
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
| File-level round-trip (test-data) | `src/test/system/*RoundTrip.system.test.ts` + `compareCsvRecords` | Yes — multiset row diff; exclude export-reassigned columns (`Location` for CHIRP) |
| Re-import / merge | System (`importMerge.test.ts`, `runActiveImportWorkflow`) | When merge interaction matters |
| Cross-format | Adapter matrix golden | When second vendor ships (OpenGD77 ↔ CHIRP shipped) |
| Lossy fields | Reference + fidelity assert | Document + test header-only / skipped files |

Checklist:

- [ ] Parse by **header name**, never column index
- [ ] `adapterContract.test.ts`: required metadata, `capabilities`, delivery type guards
- [ ] Add committed synthetic bundle under `src/test/<vendor>/` — see [fixtures.md](../../build/testing/fixtures.md)
- [ ] `roundtrip.test.ts`: deterministic ids via `setIdGenerator`; `stripIds()` before semantic compare
- [x] File-level round-trip system test against committed `test-data/<vendor>/` fixtures: import → internal `Codeplug` → export → multiset row diff (`compareCsvRecords`); exclude columns documented as export-reassigned or lossy (CHIRP: `Location`; OpenGD77: `Channel Number` — see `src/test/system/chirpRoundTrip.system.test.ts` and `opengd77RoundTrip.system.test.ts`).
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
| [`ExportFromActivePanel`](../../../src/components/ExportFromActivePanel/ExportFromActivePanel.tsx) | Registry dispatch: multi-file per-file + ZIP, or single-file download + profile picker |
| [`ImportExportSectionNav`](../../../src/components/SectionNav/sections/ImportExportSectionNav.tsx) | Secondary nav ([#81](https://github.com/pskillen/codeplug-tool/issues/81)) |

- [ ] Wire format selector to `vendorFormats.ts` capabilities
- [ ] Route import via `getImportAdapter(vendorFormat.id)`; home auto-detect via `detectImportAdapter()`
- [ ] Route export via `getExportAdapter()` + `isMultiFileExportAdapter` / `isSingleFileExportAdapter`
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

- [ ] Add cross-format golden test: import FormatA fixture → export FormatB → assert expected fields (see `src/lib/export/chirp/crossFormat.test.ts`)
- [ ] Document expected loss at each boundary in reference docs
- [ ] Optional: import FormatB → export FormatA round-trip subset

Shipped cross-format pairs (v1):

| Import | Export | Test | Expected loss |
| --- | --- | --- | --- |
| OpenGD77 | CHIRP | `crossFormat.test.ts` | DMR/digital channels skipped; zones/contacts/TGs not exported |
| CHIRP | OpenGD77 | _(not in v1)_ | No zones/contacts; analogue-only channel subset |

---

## 9. Manual verify

End-to-end smoke test before PR:

1. `npm run dev`
2. Import a sample folder **or single CSV** (home or active project)
3. Touch data via CRUD (rename channel, add zone member)
4. Export — per-file + ZIP (multi-file) or single CSV with profile picker (CHIRP)
5. Re-import exported files — merge should show expected deltas
6. Hard refresh — LocalStorage persistence intact

Use `sample-exports/` locally for manual realism (operator codeplugs — do not commit); committed fixtures in `src/test/<vendor>/` for CI. PR [#101](https://github.com/pskillen/codeplug-tool/pull/101) added reference CHIRP samples under `sample-exports/Chirp 2026-06-29/` for local testing.

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

## Worked example: CHIRP

Second shipped vendor — analogue single-file CSV ([#103](https://github.com/pskillen/codeplug-tool/issues/103)).

| Step | CHIRP location |
| --- | --- |
| Reference hub | `docs/reference/chirp/README.md` |
| Radio profiles | `docs/reference/chirp/radios/` (UV-5R Mini, UV-21Pro V2, RT95) |
| Adapter behaviour | `docs/features/import-export/chirp/README.md` |
| Import adapter | `src/lib/import/chirp/adapter.ts` — `delivery: 'single-file'`, `entityKinds: ['channels']` |
| Export adapter | `src/lib/export/chirp/adapter.ts` — `satisfies SingleFileExportAdapter` |
| Shared registry | `src/lib/import-export/registry.ts` |
| UI format | `vendorFormats.ts` — `id: 'chirp'`, both shipped |
| Fixtures | `src/test/chirp/bundles.ts` |
| Round-trip | `src/lib/export/chirp/roundtrip.test.ts` |
| Cross-format | `src/lib/export/chirp/crossFormat.test.ts` (OpenGD77 → CHIRP) |
| Lossy fields | `Location` export-only; `Comment` not on internal model; DMR channels skipped on export |

---

## Related

- [Import / export hub](README.md)
- [Format fidelity](../../build/testing/format-fidelity.md)
- [Fixtures](../../build/testing/fixtures.md)
- [Data model](../data-model/README.md)
- [Outstanding debt](outstanding.md)
