# SPA migration — outstanding

Items **skipped**, **incomplete**, or **discovered during execution** — not the plan's future phases.

**Tracking:** [opengd77-map#18](https://github.com/pskillen/opengd77-map/issues/18) (epic [#21](https://github.com/pskillen/opengd77-map/issues/21))

---

## Deploy safety

- [x] **Ticket C merged** — safe to cut a `v*` release; `pages.yml` builds the SPA with channel map at `/#/map`

## Legacy static tools

- [x] `site/` and `tools/` deleted in Ticket C (#20)
- [x] `site/build-info.js` `sed` approach fully retired

## Follow-up tickets

- [x] Ticket B (#19) — Mantine theme and responsive AppShell
- [x] Ticket C (#20) — port channel map to `react-leaflet`, delete legacy static tools

## Ticket B debt

- [ ] No light/dark toggle — app is dark-only by design for now
- [x] `matchMedia` mock added in `src/test/setup.ts` for jsdom (Mantine color scheme)

## Ticket C debt

- [ ] Bundle size warning (~617 kB JS) — consider code-splitting `ChannelMap` route in a follow-up
- [x] `localStorage` and `ResizeObserver` mocks added in `src/test/setup.ts` for jsdom

## Documentation

- [ ] Update [git-workflow skill](../../.cursor/skills/git-workflow/SKILL.md) pre-commit checks for `npm run lint/test` (deferred — skill still references static HTML smoke tests)
- [ ] Update [version-number skill](../../.cursor/skills/version-number/SKILL.md) legacy static tools note (optional cleanup)
