# CHIRP CSV import/export — outstanding

Items **skipped**, **incomplete**, or **discovered during execution** — not future plan phases.

**Tracking:** [codeplug-tool#103](https://github.com/pskillen/codeplug-tool/issues/103) · [#109](https://github.com/pskillen/codeplug-tool/issues/109)

---

## Resolved in #103 / #109

- Adapter interface contracts in `src/lib/import-export/`
- Registry-based import/export routing
- CHIRP import + export shipped
- Cross-format OpenGD77 → CHIRP test
- File-level round-trip system tests (`test-data/chirp/`) — model-only serialisation with profile power ladders
- `Channel.comment` first-class field (schema v8)
- `wireColumns` provenance stash removed ([#103](https://github.com/pskillen/codeplug-tool/issues/103) follow-up)
- Profile-aware import/export for CHIRP and OpenGD77 ([#109](https://github.com/pskillen/codeplug-tool/issues/109), [#72](https://github.com/pskillen/codeplug-tool/issues/72))

## Open / deferred

- [ ] **CHIRP DCS / CrossMode** — export constants only; real DCS tone mapping follow-up
- [ ] **CHIRP → OpenGD77 cross-format** — not in v1
- [x] **OpenGD77 file-level round-trip** — [#108](https://github.com/pskillen/codeplug-tool/issues/108) (`test-data/opengd77/`, `opengd77RoundTrip.system.test.ts`)
- [ ] **MD9600 power ladder validation** — provisional table in [opengd77-md9600.md](../../reference/opengd77/radios/opengd77-md9600.md)
