# Agent guide — MM9PDY Codeplug Tool

Instructions for AI agents working in this repository.

## What this repo is

**A browser-based companion for amateur radio codeplug design** — a modern layer on top of clunky, vendor-locked CPS (customer programming software). It does **not** write a radio's binary codeplug; it helps operators design a codeplug *layout* (channels, zones, talk groups, TG lists, contacts) and export it in a format the vendor CPS already speaks (usually CSV), to import and flash there.

Core workflows: import an existing CPS CSV export, or start a blank project; edit/visualise; export back to a vendor format; and store the working state in a native **YAML** format. State persists in browser **LocalStorage** today (cloud storage — Dropbox / OneDrive / Google Drive — is planned). The aim is cross-vendor; **OpenGD77 is the first and currently only first-class target**, and the import/export layers are being built to be vendor-agnostic.

What ships today is the **channel map**; the broader backlog (genericise import, native YAML, CPS export, persistence, CRUD, reports, cloud storage) is tracked as GitHub issues. See the [README](README.md) for the user-facing overview and roadmap.

This repo is a **Vite + React + TypeScript SPA** (Mantine UI, react-leaflet maps) at the repo root, deployed to **GitHub Pages** when a full GitHub release is published (not a pre-release) (see [`docs/build/README.md`](docs/build/README.md)).

## Repository layout

| Path | Role |
|------|------|
| `README.md` | User-facing overview and usage |
| `AGENTS.md` | This file — agent workflow |
| `index.html` | Vite entry HTML |
| `src/` | React app — routes, components, lib |
| `src/components/ChannelMap/` | Channel map UI (react-leaflet) |
| `src/models/` | Internal codeplug data models — [data-model](docs/features/data-model/README.md) |
| `src/lib/import/` | CPS import adapters and registry — [import](docs/features/import/README.md) |
| `src/state/` | Central codeplug store (persistence-ready) |
| `package.json`, `vite.config.ts`, `tsconfig.json` | SPA build and tooling |
| `docs/build/` | Build and deploy documentation |
| `docs/build/testing/` | Testing strategy — [README](docs/build/testing/README.md) |
| `docs/build/spa/` | SPA migration progress and outstanding logs |
| `docs/features/map/` | Channel map contributor docs — [README](docs/features/map/README.md) |
| `docs/features/` | Feature doc index and progress logs |
| `.cursor/rules/` | File-scoped editor rules |
| `.cursor/skills/` | Agent skills — make a plan, git workflow, progress tracking, feature docs |

## OpenGD77 CSV inputs

OpenGD77 is the first-class CPS target. Authoritative column and conversion reference: [`docs/reference/opengd77/`](docs/reference/opengd77/README.md) (generic wire format) and [`docs/reference/opengd77/radios/`](docs/reference/opengd77/radios/README.md) (per-radio limits and features). Adapter behaviour: [import docs](docs/features/import/opengd77.md).

The internal codeplug model is **radio-agnostic**; radio specifics apply at export time. Today's adapter is calibrated to the Baofeng 1701 profile.

Treat vendor CSV as a lossy interchange format at the edges; parse by **header name**, not column index. Preserve case-sensitive channel name foreign keys. Do not commit operator codeplug exports unless the user explicitly asks. Use `sample-exports/` (gitignored) for local testing.

## Vendor boundaries

The internal codeplug model is **vendor-neutral**. State explicitly **where** radio or CPS constraints apply. Do not let OpenGD77 (or any single target radio) leak into internal models, mutations, validation, or CRUD UI.

| Layer | Apply vendor limits? | Examples |
| --- | --- | --- |
| **Import / export boundary** | **Yes** | Column mapping, header names, cardinality caps, truncation, warnings, profile-specific serialise rules — `src/lib/import/`, `src/lib/export/`, `docs/reference/` |
| **Internal model, store, mutations, validation, CRUD UI** | **No** | `src/models/codeplug.ts`, `src/lib/codeplugMutations.ts`, `src/lib/validation/`, `src/routes/`, `src/state/` — no radio profile constants, no member-count caps, no “Baofeng 1701” assumptions |
| **Grey area — vendor-specific features** | **Optional, additive** | Fields that map to one vendor’s CPS but do not block others (e.g. `vendorExtras`, opaque wire strings). Store in the internal model when useful; **importer/exporter** decides survival across the boundary (drop, warn, truncate, or round-trip). Do not reject or cap in CRUD because export might not round-trip. |

**Anti-patterns:** baking radio profile caps or target-radio constants into mutations, validation, or CRUD UI; introducing `OPENGD77_MAX_*` (or similar) for internal-model work without an explicit export-only slice.

**Internal FK rules** (not radio-specific): wire-name uniqueness where channels resolve contacts or RX group lists by name; shared talk-group/contact namespace. Cardinality and column survival defer to export per [radio profiles](docs/reference/opengd77/radios/README.md).

Canonical model reference: [data-model](docs/features/data-model/README.md). If pre-existing vendor leakage remains in the codebase (e.g. zone member caps from an earlier slice), do not copy the pattern into new code — fix or defer explicitly.

## Working principles

1. **SPA at repo root** — React components under `src/`; Vite bundles for GitHub Pages (`base: '/codeplug-tool/'`). HashRouter for subpath routing.
2. **Vendor boundaries** — Radio limits and CPS column mapping at import/export only; internal model, CRUD, and validation stay vendor-neutral (see [Vendor boundaries](#vendor-boundaries)).
3. **Parse by header name** — CPS CSV column order can vary; never hard-code column positions. Keep vendor specifics at the import/export edges, not in feature code.
4. **Preserve CPS quirks** — channel names are case-sensitive foreign keys across files.
5. **Minimize scope** — one feature per PR; match existing UI patterns in the SPA.
6. **Privacy** — operator data and tokens (e.g. Mapbox, future cloud OAuth) belong in browser `localStorage` only, never in the repo.
7. **Deploy** — merge to `main` for source; publish to GitHub Pages by publishing a full GitHub release (see `docs/build/README.md`).

## Git workflow

Follow [`.cursor/skills/git-workflow/SKILL.md`](.cursor/skills/git-workflow/SKILL.md) for branching, commits, and PRs.

- Prefer **atomic conventional commits** per logical change.
- Branch + pull request for features; `main` holds releasable source.
- **Publish:** publish a full GitHub release (not a pre-release) to deploy GitHub Pages (not every merge to `main`).
- Use **`user-github-personal`** MCP for issues and PRs (not `gh` CLI).
- Do not commit `.env`, secrets, or personal `sample-exports/`.

## Plans and feature docs

To plan work from GitHub issue numbers, follow [make-a-plan](.cursor/skills/make-a-plan/SKILL.md).

For multi-commit or multi-PR work:

- Document tools under `docs/features/<topic>/` per [feature-docs](.cursor/skills/feature-docs/SKILL.md).
- SPA migration tracking lives under `docs/build/spa/` per [progress-tracking](.cursor/skills/progress-tracking/SKILL.md).
- Maintain `*-progress.md` and `*-outstanding.md` per [progress-tracking](.cursor/skills/progress-tracking/SKILL.md).
- Index new topics in [`docs/features/README.md`](docs/features/README.md) or [`docs/build/README.md`](docs/build/README.md) as appropriate.

## Disclaimer

Frequency and site data loaded from user CSVs is for amateur programming convenience. Not authoritative for emergency operations.
