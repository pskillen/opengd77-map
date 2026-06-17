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
| `opengd77-channel-map.html` | Channel + zone map viewer (on feature branches as added) |
| `.cursor/rules/` | File-scoped editor rules |

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

- Prefer **atomic conventional commits** per logical change.
- Branch + pull request for features; `main` stays releasable.
- Do not commit `.env`, secrets, or personal `sample-exports/`.

## Disclaimer

Frequency and site data loaded from user CSVs is for amateur programming convenience. Not authoritative for emergency operations.
