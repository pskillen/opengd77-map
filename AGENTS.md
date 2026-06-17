# Agent guide — opengd77-map

Instructions for AI agents working in this repository.

## What this repo is

**Browser tools for OpenGD77 codeplug geography** — visualise CPS export data on a map so operators can plan channels, coordinates, and zones more easily than in the desktop CPS alone.

This repo is intentionally small: static HTML/JS pages, no build step, no backend. Each tool loads OpenGD77 CSV exports in the browser.

## Repository layout

| Path | Role |
|------|------|
| `README.md` | User-facing overview and usage |
| `AGENTS.md` | This file — agent workflow |
| `opengd77-channel-map.html` | Channel + zone map viewer |
| `docs/features/map/` | Channel map contributor docs — [README](docs/features/map/README.md) |
| `docs/features/` | Feature doc index and progress logs |
| `.cursor/rules/` | File-scoped editor rules |
| `.cursor/skills/` | Agent skills — git workflow, progress tracking, feature docs |

## OpenGD77 CSV inputs

The channel map reads standard OpenGD77 CPS exports:

- **`Channels.csv`** — `Channel Name`, `Channel Type`, `Latitude`, `Longitude`, `Use Location`, frequencies, DMR contact/TG list columns (matched by header name, not column index).
- **`Zones.csv`** — `Zone Name`, `Channel1`…`Channel80` (member names must match `Channel Name` exactly).

Do not commit operator codeplug exports unless the user explicitly asks. Use `sample-exports/` (gitignored) for local testing.

## Working principles

1. **Stay static** — prefer single-file or few-file browser tools; avoid introducing a bundler unless the user asks.
2. **Parse by header name** — OpenGD77 CSV column order can vary; never hard-code column positions.
3. **Preserve CPS quirks** — channel names are case-sensitive foreign keys across files.
4. **Minimize scope** — one tool per HTML file; match existing UI patterns in the map page.
5. **Privacy** — Mapbox tokens belong in browser `localStorage` only, never in the repo.

## Git workflow

Follow [`.cursor/skills/git-workflow/SKILL.md`](.cursor/skills/git-workflow/SKILL.md) for branching, commits, and PRs.

- Prefer **atomic conventional commits** per logical change.
- Branch + pull request for features; `main` stays releasable and publishes to **GitHub Pages**.
- Use **`user-github-personal`** MCP for issues and PRs (not `gh` CLI).
- Do not commit `.env`, secrets, or personal `sample-exports/`.

## Plans and feature docs

For multi-commit or multi-PR work:

- Document tools under `docs/features/<topic>/` per [feature-docs](.cursor/skills/feature-docs/SKILL.md).
- Maintain `*-progress.md` and `*-outstanding.md` per [progress-tracking](.cursor/skills/progress-tracking/SKILL.md).
- Index new topics in [`docs/features/README.md`](docs/features/README.md).

## Disclaimer

Frequency and site data loaded from user CSVs is for amateur programming convenience. Not authoritative for emergency operations.
