# Import / export — outstanding

Items **skipped**, **incomplete**, or **discovered during execution** — not future plan phases.

**Tracking:** [codeplug-tool#84](https://github.com/pskillen/codeplug-tool/issues/84) (doc collate); debt from [#38](https://github.com/pskillen/codeplug-tool/issues/38), [#58](https://github.com/pskillen/codeplug-tool/issues/58), [#72](https://github.com/pskillen/codeplug-tool/issues/72)

---

## Lossy / deferred by design

- [ ] **APRS configs not modelled** — `APRS.csv` is not imported; exported header-only inside ZIP. Channel `aprsConfigName` round-trips but config body is lost.
- [ ] **DTMF contacts not modelled** — `DTMF.csv` not imported; exported header-only inside ZIP.

## Export

- [ ] **Radio profile picker** — apply per-radio limits at export time ([#72](https://github.com/pskillen/codeplug-tool/issues/72)). Today's exporter uses the [Baofeng 1701 profile](../../reference/opengd77/radios/baofeng-1701.md) without a profile picker UI.

## Fixtures

- [ ] Operator-provided real OpenGD77 CPS export subset (optional — synthetic bundles in `src/test/opengd77/` cover system tests today)

## Documentation

- [ ] **Review OpenGD77 / 1701 import-export implementation** against the new `import-export/` docs for completeness and accuracy ([#91](https://github.com/pskillen/codeplug-tool/issues/91)) — file follow-up tickets for any code gaps found.
