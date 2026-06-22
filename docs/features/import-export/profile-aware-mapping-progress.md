# Profile-aware power/squelch + CHIRP true round-trip — progress

**Tracking:** [codeplug-tool#109](https://github.com/pskillen/codeplug-tool/issues/109) · [#72](https://github.com/pskillen/codeplug-tool/issues/72) · [#103](https://github.com/pskillen/codeplug-tool/issues/103) follow-up
**Branch:** `109/paddy/profile-aware-power-roundtrip`

---

## Overall status

**Status:** Complete — ready for PR

---

## Slices

| Slice | Status |
| --- | --- |
| 1 — Reference docs (power ladders) | Done |
| 2 — `ImportOptions.profileId` + `getFormatProfiles` | Done |
| 3 — Shared profile modules + ladder helpers | Done |
| 4 — `Channel.comment` + schema v8 migration | Done |
| 5 — CHIRP model-only import/export | Done |
| 6 — OpenGD77 profile power + cardinality | Done |
| 7 — Remove `wireColumns` from provenance | Done |
| 8 — Import + export profile pickers | Done |
| 9 — CRUD comment + import compare | Done |
| 10 — Tests + doc reconciliation | Done |

---

## Notes

- MD9600 ladder marked provisional pending CPS fixture validation.
- CHIRP zero-offset split duplex preserved via `chirpDuplexWire`/`chirpOffsetWire` provenance (not full `wireColumns` stash).
