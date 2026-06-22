# MM9PDY Codeplug Tool

A browser-based companion for amateur radio **codeplug** design — a modern layer on top of the clunky, vendor-locked **CPS** (customer programming software) we all have to live with.

**Live site:** [pskillen.github.io/codeplug-tool](https://pskillen.github.io/codeplug-tool/) (updated when a full GitHub release is published).

> **OpenGD77 CSV** is the first shipped import/export **format** — one format among several planned (Baofeng DM32 CSV, qDMR YAML, native YAML, and analogue-only formats like CHIRP). The data model and import/export layers are built to be format-agnostic; OpenGD77 is not special, just first.

## What it is

If you program DMR or FM radios, you already know the drill: every manufacturer ships its own CPS, most are dated, fiddly, Windows-only, and none of them talk to each other. Worse, they are closed ecosystems — the on-radio codeplug format is proprietary and undocumented.

So this tool deliberately does **not** try to write your radio's binary codeplug. Instead it helps you design a codeplug **layout** — channels, zones, talk groups, TG lists, contacts — with a far nicer UI than the CPS, then **exports it in a format your CPS already understands** (usually CSV). You import that into the vendor CPS as the last step and write it to the radio there.

Think of it as the planning and management front-end the CPS never gave you:

- **Visualise** your codeplug — see channels on a map instead of squinting at a spreadsheet of lat/long.
- **Manage** channels, zones, talk groups, and contacts with sane editing and validation.
- **Enrich** automatically where it helps (e.g. geography, references) rather than hand-typing everything.
- **Work across formats** from one consistent interface (OpenGD77 CSV first; more formats planned).

## How you'd use it

The tool is built around a small number of round-trip workflows:

1. **Start from your existing codeplug.** Export it from your CPS as CSV and import it here — OpenGD77, CHIRP, or another supported format.
2. **Or start fresh.** Create a blank project and build the codeplug from scratch.
3. **Edit and persist.** Changes save in your browser; optional native YAML and cloud sync are planned.
4. **Export for your radios.** Export the same project to **one or more** CPS formats when you are ready to flash — DMR via OpenGD77, analogue FM via CHIRP, etc.

Full workflow: [`docs/features/workflows/operator-lifecycle.md`](docs/features/workflows/operator-lifecycle.md).

### Storage

Your data lives in your browser's **LocalStorage** for now — nothing is uploaded to a server, and CSVs you load never leave your machine. Cloud sync (Dropbox, OneDrive, Google Drive) is planned so a codeplug can follow you across devices.

## Status and roadmap

| Capability | State |
| --- | --- |
| Channel map (markers, zone hulls, OSM/Mapbox tiles) | **Shipped** |
| Format-agnostic internal data model | **Shipped** (refactor ongoing) |
| Native YAML import / export | Planned |
| Export to a chosen format (OpenGD77 shipped; CHIRP in progress; DM32, qDMR planned) | In progress |
| LocalStorage persistence | **Shipped** |
| Multiple projects, switchable | **Shipped** |
| CRUD for channels / zones / talk groups + TG lists / contacts | In progress |
| Read-only tabular report (zones, channels, TGs) | **Shipped** |
| Cloud storage (Dropbox / OneDrive / Google Drive) | Planned |

Planned work is tracked as [GitHub issues](https://github.com/pskillen/codeplug-tool/issues) — browse the open tickets for the current backlog and design notes.

### What ships today

**Report views** — import an OpenGD77 CPS export and browse channels, zones, talk groups, contacts, and RX group lists as tables with detail pages. Channels and zones pages include an inset map.

**Channel map** — plot channels with valid coordinates; draw coloured hulls around zone members. Default tiles are OpenStreetMap (no API key); configure Mapbox streets/satellite on **Settings** — tokens stay in browser LocalStorage only.

Open the [live app](https://pskillen.github.io/codeplug-tool/), or run locally and go to `/#/summary`. Docs: [`docs/features/report/`](docs/features/report/README.md), [`docs/features/map/`](docs/features/map/README.md).

## Development

This is a **Vite + React + TypeScript** single-page app (Mantine UI, react-leaflet maps) at the repo root, deployed to GitHub Pages.

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/codeplug-tool/`. Useful scripts: `npm run lint`, `npm run format:check`, `npm run test`, `npm run build`.

Use local CPS exports from `sample-exports/` (gitignored) for testing — do not commit operator codeplugs.

### Where to find things

| You want… | Look in |
| --- | --- |
| Agent / editor conventions and repo layout | [`AGENTS.md`](AGENTS.md) |
| Build, versioning, and deploy details | [`docs/build/README.md`](docs/build/README.md) |
| Feature contributor docs (index) | [`docs/features/README.md`](docs/features/README.md) |
| Channel map internals | [`docs/features/map/README.md`](docs/features/map/README.md) |
| Git workflow (branching, commits, PRs) | [`.cursor/skills/git-workflow/SKILL.md`](.cursor/skills/git-workflow/SKILL.md) |
| Agent skills (progress tracking, feature docs, versioning) | [`.cursor/skills/`](.cursor/skills/) |

The deployed build shows its environment and version in the page footer — see the [version-number skill](.cursor/skills/version-number/SKILL.md) for how that is injected.

## Disclaimer

Frequency, coordinate, and site data come from the CSVs you load and are for amateur programming convenience only. They are **not authoritative** for emergency or any safety-critical operations. You are responsible for the data in your own codeplugs and exports.
