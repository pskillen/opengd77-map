# DM32 CPS CSV import/export — progress

**Tracking:** [codeplug-tool#67](https://github.com/pskillen/codeplug-tool/issues/67)  
**Plan:** `.cursor/plans/dm32_cps_import_export_6d772ebf.plan.md`

---

## Overall status

**Status:** In progress

**Branch:** `67/paddy/dm32-import-export`

---

## Slices

| Slice | Status |
| --- | --- |
| 0: Fixture + scaffold | Done |
| 0.b: Contact model refactor | Done |
| 1: Wire reference + radio profile | Done |
| 2.5: `expandModes` on channelExpansion | Not started |
| 3: DM32 import adapter | Not started |
| 4: DM32 export adapter | Not started |
| 5: File-level round-trip system test | Not started |
| 6: Import/export UI | Not started |
| 7: Doc reconciliation + PR | Not started |

---

## Verify

- `npm run format:check && npm run lint && npm run test && npm run test:system && npm run build`
- `dm32RoundTrip.system.test.ts` against `test-data/baofeng-dm32/v1.60/`
