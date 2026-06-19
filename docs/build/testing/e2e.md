# End-to-end tests (Playwright)

**Purpose:** Browser-only guarantees — file picker, hard reload, export download, real LocalStorage — that Vitest cannot provide. Adapter correctness stays in [format-fidelity](format-fidelity.md) and [system](system.md) layers.

**Status:** Planned — [#40](https://github.com/pskillen/codeplug-tool/issues/40). No Playwright config or `test:e2e` script on `main` yet.

## North star spec (#40)

First spec: **import → refresh → export** with per-file diff.

1. Start app (`vite preview` on CI build or `webServer` in `playwright.config.ts`).
2. Navigate to `/#/`; import committed fixture folder (OpenGD77 CSVs).
3. Assert import summary recognises expected files.
4. `page.reload()` — confirm project and data restored (channel count or export page enabled).
5. Navigate to `/#/export`; trigger **Download all (.zip)**.
6. Unzip download; diff each substantive CSV against fixture (`Channels`, `Zones`, `Contacts`, `TG_Lists`).
7. Normalise before compare — see [fixtures.md](fixtures.md).

## Configuration (when #40 lands)

| Piece | Path / notes |
| --- | --- |
| Dependency | `@playwright/test` |
| Config | `playwright.config.ts` — `baseURL`, `webServer` for Vite |
| Specs | `e2e/` |
| Fixtures | `e2e/fixtures/opengd77-minimal/` — synthetic, committed |
| Scripts | `test:e2e`, `test:e2e:ui` |

### HashRouter routes

| Route | Use in e2e |
| --- | --- |
| `/#/` | Home import, new project |
| `/#/export` | CSV / ZIP download |
| `/#/map` | Optional smoke after import |

### Storage isolation

- LocalStorage key: `mm9pdy-codeplug-tool.codeplug` (verify in `codeplugStorage.ts` if renamed).
- New browser context per test, or `localStorage.clear()` in `beforeEach`.
- Never use operator `sample-exports/` in committed fixtures.

### Download handling

Playwright `download` event → temp dir → unzip (`fflate` in Node or system `unzip` on CI).

## Comprehensive suite vision

Phased delivery after the round-trip spec:

| Phase | Specs | Priority |
| --- | --- | --- |
| 1 | Import → reload → ZIP export → file diff | #40 — ship first |
| 2 | Active import on Export page (merge + overwrite confirm) | High |
| 3 | CRUD edit channel → export reflects change | Medium |
| 4 | Map route smoke (markers render with fixture) | Lower |
| 5 | Multi-project switch + persistence | Lower |

Visual regression / screenshot tests are **out of scope**.

## Relationship to format fidelity

| E2e proves | Vitest proves |
| --- | --- |
| File picker and folder drop UI | `importFiles` with `File[]` |
| Hard reload restores LocalStorage | `codeplugStorage.test.ts`, system persist step |
| Download button produces files on disk | `serialiseOpenGd77Files` |
| End-to-end operator path | Parser/serialiser correctness |

E2e should use the **same fixture bundles** as system tests where possible ([fixtures.md](fixtures.md)).

## CI

When [#40](https://github.com/pskillen/codeplug-tool/issues/40) lands, extend the **Checks** workflow [`.github/workflows/checks.yaml`](../../.github/workflows/checks.yaml):

- Install Playwright browsers
- Run `npm run test:e2e` after unit + system pass
- May use `vite preview` on `dist/` from `npm run build`

## Related

- [Testing hub](README.md)
- [#40](https://github.com/pskillen/codeplug-tool/issues/40)
- [Format fidelity](format-fidelity.md)
- [Fixtures](fixtures.md)
