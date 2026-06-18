# MM9PDY Codeplug Tool

A browser-based companion for amateur radio **codeplug** design — a modern layer on top of the clunky, vendor-locked **CPS** (customer programming software) we all have to live with.

**Live site:** [pskillen.github.io/codeplug-tool](https://pskillen.github.io/codeplug-tool/) (updated when a full GitHub release is published).

> Currently targets **OpenGD77** radios. Support for other vendors is planned — the data model and import/export layers are being built to be vendor-agnostic.

## What it is

If you program DMR or FM radios, you already know the drill: every manufacturer ships its own CPS, most are dated, fiddly, Windows-only, and none of them talk to each other. Worse, they are closed ecosystems — the on-radio codeplug format is proprietary and undocumented.

So this tool deliberately does **not** try to write your radio's binary codeplug. Instead it helps you design a codeplug **layout** — channels, zones, talk groups, TG lists, contacts — with a far nicer UI than the CPS, then **exports it in a format your CPS already understands** (usually CSV). You import that into the vendor CPS as the last step and write it to the radio there.

Think of it as the planning and management front-end the CPS never gave you:

- **Visualise** your codeplug — see channels on a map instead of squinting at a spreadsheet of lat/long.
- **Manage** channels, zones, talk groups, and contacts with sane editing and validation.
- **Enrich** automatically where it helps (e.g. geography, references) rather than hand-typing everything.
- **Work across vendors** from one consistent interface (OpenGD77 first).

## How you'd use it

The tool is built around a small number of round-trip workflows:

1. **Start from your existing codeplug.** Export it from your CPS as CSV and import it here.
2. **Or start fresh.** Create a blank project and build the codeplug from scratch.
3. **Export for your radio.** However you started, export back out in a format your CPS speaks, ready to import and flash.
4. **Keep a clean source of truth.** Store and re-open your work in a native **YAML** format that fully captures the codeplug, independent of any one vendor's lossy CSV.

### Storage

Your data lives in your browser's **LocalStorage** for now — nothing is uploaded to a server, and CSVs you load never leave your machine. Cloud sync (Dropbox, OneDrive, Google Drive) is planned so a codeplug can follow you across devices.

## Status and roadmap

| Capability | State |
| --- | --- |
| Channel map (markers, zone hulls, OSM/Mapbox tiles) | **Shipped** |
| Vendor-agnostic internal data model (genericise import) | Planned |
| Native YAML import / export | Planned |
| CPS export (internal model → vendor CSV) | Planned |
| LocalStorage persistence | Planned |
| Multiple projects, switchable | Planned |
| CRUD for channels / zones / talk groups + TG lists / contacts | Planned |
| Read-only tabular report (zones, channels, TGs) | Planned |
| Cloud storage (Dropbox / OneDrive / Google Drive) | Planned |

Planned work is tracked as [GitHub issues](https://github.com/pskillen/codeplug-tool/issues) — browse the open tickets for the current backlog and design notes.

### What ships today: the channel map

The map is the first feature. Load an OpenGD77 `Channels.csv` export to plot channels with valid coordinates; optionally add `Zones.csv` to draw a coloured hull around each zone's geolocated members. Default tiles are OpenStreetMap (no API key); paste a [Mapbox token](https://account.mapbox.com/access-tokens/) in the sidebar for streets/satellite tiles — the token is stored in browser LocalStorage only.

Open the [live channel map](https://pskillen.github.io/codeplug-tool/#/map), or run it locally (below) and go to `/#/map`. Full behaviour notes: [`docs/features/map/`](docs/features/map/README.md).

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
