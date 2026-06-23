# DM32 CPS CSV import/export — progress

**Tracking:** [codeplug-tool#67](https://github.com/pskillen/codeplug-tool/issues/67)

---

## Overall status

**Status:** Complete (PR open)

**Branch:** `67/paddy/dm32-import-export`

---

## Slices

| Slice | Status |
| --- | --- |
| 0: Fixture + scaffold | Done |
| 0.b: Contact model refactor | Done |
| 1: Wire reference + radio profile | Done |
| 2.5: `expandModes` on channelExpansion | Done |
| 3: DM32 import adapter | Done |
| 4: DM32 export adapter | Done |
| 5: File-level round-trip system test | Done |
| 6: Import/export UI | Done |
| 7: Doc reconciliation + PR | Done |

---

## Verify

- `npm run format:check && npm run lint && npm run test && npm run test:system && npm run build`
- `dm32RoundTrip.system.test.ts` — 6 in-scope files vs `test-data/baofeng-dm32/v1.60/`
- `src/lib/export/dm32/roundtrip.test.ts` — synthetic minimal bundle
