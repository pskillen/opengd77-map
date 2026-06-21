# Pristine internal data model refactor — outstanding

Items **skipped**, **incomplete**, or **discovered during execution** — not the epic's future phases (those live in the [epic plan](../../../.cursor/plans/vendor-neutral_data_model_epic_941d5a01.plan.md) and per-phase subplans).

**Tracking:** [codeplug-tool#93](https://github.com/pskillen/codeplug-tool/issues/93)
**Progress:** [pristine-model-refactor-progress.md](pristine-model-refactor-progress.md)

---

## Audit findings to land or ticket

- [x] Silent zone-member truncation on OpenGD77 export (no warning) — moved to [#95](https://github.com/pskillen/codeplug-tool/issues/95). (review doc finding A)
- [x] `OPENGD77_MAX_ZONE_MEMBERS` enforced in mutations/validation/UI — move the cap to export only; tracked in [#95](https://github.com/pskillen/codeplug-tool/issues/95). (review doc §6)
- [x] `rxOnly` stored as `Yes`/`No` string — scheduled for Phase 2 boolean conversion. (review doc finding B)
- [x] Persistence README says `CODEPLUG_SCHEMA_VERSION = 1` (actual 3) — fixed in Phase 0 PR #94. (review doc finding C)

## Discovered during execution

- [x] OpenGD77 1–1023 channel-count over-limit export warning — deferred to [#95](https://github.com/pskillen/codeplug-tool/issues/95) (Phase 1 assigns sequentially without cap enforcement).

## Deferred (out of scope for this epic)

- [ ] APRS/DTMF entity modelling — `aprsConfigName` stays a string FK.
- [ ] OpenGD77 radio-variant picker at export ([#72](https://github.com/pskillen/codeplug-tool/issues/72)).
- [ ] Second-format adapters (DM32, qDMR, CHIRP) — model made ready, not implemented.
