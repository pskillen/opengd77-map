# Testing strategy docs — outstanding

Items **skipped**, **incomplete**, or **discovered during #78 execution** — not the strategy itself.

**Tracking:** [codeplug-tool#78](https://github.com/pskillen/codeplug-tool/issues/78)

---

## CI (#79)

- [x] Checks workflow shipped — [`.github/workflows/checks.yaml`](../../.github/workflows/checks.yaml); `test:coverage` runs full Vitest suite (includes system tests)
- [ ] Wire `test:e2e` into PR workflow when [#40](https://github.com/pskillen/codeplug-tool/issues/40) lands

## Doc follow-up

- [ ] Review [testing-gaps.md](testing-gaps.md) with maintainer; open rework tickets only where gaps matter
