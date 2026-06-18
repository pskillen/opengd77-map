# opengd77-map

Browser tools for visualising and planning **OpenGD77** codeplugs.

OpenGD77 CPS exports include latitude/longitude on channels and zone membership lists, but the desktop CPS does not show you how those sites relate geographically. This repository provides an offline-friendly web app that makes that layout easier to see and reason about when you are building or reviewing a codeplug.

The primary goal is to help you **set up OpenGD77 codeplugs** — spot missing coordinates, see which repeaters sit near each other, and check whether zone boundaries match the geography you intend.

**Live site:** [pskillen.github.io/opengd77-map](https://pskillen.github.io/opengd77-map/) (updated when a full GitHub release is published).

## Development

See [`AGENTS.md`](AGENTS.md) for agent/editor conventions. Local CPS exports for testing go in `sample-exports/` (gitignored). Build and deploy details: [`docs/build/README.md`](docs/build/README.md).

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/opengd77-map/` — channel map at `/#/map`.

## Channel map

The channel map is a route in the SPA at `/#/map`.

**Online:** [channel map](https://pskillen.github.io/opengd77-map/#/map)

### Use

1. Open the live link above or run `npm run dev` locally.
2. Navigate to **Channel map** (or go directly to `/#/map`).
3. Load `Channels.csv` from an OpenGD77 CPS export via the file picker or drag-and-drop.
4. Optionally load `Zones.csv` from the same export (after channels). Each zone gets a coloured convex hull around its geolocated members; channels in multiple zones contribute to each hull.
5. Markers show channels with valid coordinates. Popups include name, mode, frequencies, and DMR contact/TG list.

No server or API key required — default tiles are OpenStreetMap.

### Zones

Zone member names are matched to **Channel Name** in `Channels.csv`. Hull points respect the same filters as markers (**Use Location**, **Skip 0,0**, etc.). Overlapping hulls are expected when zones share repeaters.

### Optional Mapbox

Paste a [Mapbox access token](https://account.mapbox.com/access-tokens/) in the sidebar to use Mapbox streets or satellite tiles. The token is stored in **browser localStorage only**.

### Notes

- Parses OpenGD77 CSV column headers (not column positions).
- Requires network access for map tiles (CDN + tile server), not for CSV parsing.

## Licence

Use and adapt as you like; frequency data in your own exports remains your responsibility.
