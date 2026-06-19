# Testing gaps — audit notes (#78)

**Not part of the testing strategy.** Notes from the #78 doc initiative comparing prescriptive strategy to the repo today. Review with maintainer; open separate GitHub issues only where rework is worth doing.

**Tracking:** [codeplug-tool#78](https://github.com/pskillen/codeplug-tool/issues/78)

---

## Observations (point in time)

| Area | Strategy expectation | Notes |
| --- | --- | --- |
| OpenGD77 serialise unit tests | Per-column export fidelity in unit layer | Covered indirectly by `roundtrip.test.ts`; dedicated `serialise.test.ts` may add value for edge columns — optional |
| PR checks + coverage | `npm run test:coverage` on every PR | Shipped — [`.github/workflows/checks.yaml`](../../.github/workflows/checks.yaml) |
| Playwright e2e | Browser import → reload → export diff | Not implemented — [#40](https://github.com/pskillen/codeplug-tool/issues/40) |
| Second vendor adapter | Adapter matrix cell + cross-format tests | No second vendor yet — pattern documented only |
| Real operator CPS fixtures in system suite | Sanitised subset under `src/test/opengd77/` | Synthetic bundles shipped; real-export scenario optional per #58 outstanding |

## Assessment

Existing unit, round-trip, merge, and system tests largely align with the written strategy. No mandatory rework tickets identified at audit time — treat rows above as optional improvements unless priorities change.
