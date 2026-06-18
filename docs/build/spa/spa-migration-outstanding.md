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

- [ ] Bundle size warning (~617 kB JS) — code-split `ChannelMap` route in a follow-up ([#26](https://github.com/pskillen/opengd77-map/issues/26))
- [x] `localStorage` and `ResizeObserver` mocks added in `src/test/setup.ts` for jsdom

## Documentation

- [x] Update [git-workflow skill](../../.cursor/skills/git-workflow/SKILL.md) pre-commit checks for `npm run lint/test/build` (was referencing static HTML smoke tests)
- [x] [version-number skill](../../.cursor/skills/version-number/SKILL.md) rewritten for Vite `define`; legacy static tools note retained as historical context
- [x] Channel map feature docs ([channels.md](../../features/map/channels.md), [zones.md](../../features/map/zones.md)) aligned with the react-leaflet port (removed `refreshMap`/`fitMapToLayers`, imperative `L.circle`/`L.polyline`/`L.polygon`, and DOM element-id references)
