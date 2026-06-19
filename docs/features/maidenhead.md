# Maidenhead locator conversion

Conversion between Maidenhead grid locators and WGS84 coordinates — shared library used by channel CRUD and the standalone Reference tool.

**Tracking:** [codeplug-tool#11](https://github.com/pskillen/codeplug-tool/issues/11) (channel CRUD) · [codeplug-tool#47](https://github.com/pskillen/codeplug-tool/issues/47) (standalone converter) · [codeplug-tool#50](https://github.com/pskillen/codeplug-tool/issues/50) (map grid overlay) · [codeplug-tool#59](https://github.com/pskillen/codeplug-tool/issues/59) (device geolocation)

## Purpose

### Channel CRUD (#11)

Channels store `location: { lat, lon }` and `useLocation`. The CRUD UI:

- **Displays** a Maidenhead locator derived from stored coordinates on list/detail pages.
- **Accepts** locator input on the channel edit form and converts to lat/lon on save.
- **Use my location** button seeds lat/lon from the device GPS (sets `useLocation`).

### Standalone converter (#47)

Operators can convert locators and coordinates ad hoc without editing a channel:

- Route: `/#/reference/maidenhead` (linked from Reference index)
- Two-way live conversion with selectable precision (4/6/8/10)
- Map click/drag to set coordinates (`MapLocationPicker`)
- Address/postcode geocoding (Mapbox when Settings token is set; Photon as fallback or explicit choice)
- Channel lookup from active codeplug (debounced autocomplete; applies channel coordinates when set)
- **Use my location** button seeds lat/lon from the device GPS at the selected precision

Channel map rendering is documented in [map/](map/README.md).

## Code anchors

| Path | Role |
| --- | --- |
| `src/lib/maidenhead.ts` | `locatorToCoords`, `coordsToLocator`, `isValidLocator` |
| `src/lib/maidenheadGrid.ts` | Grid line/label geometry for map overlay |
| `src/lib/geocode.ts` | `geocodeQuery` — Mapbox / Photon address lookup |
| `src/lib/geolocation.ts` | `requestCurrentPosition` — browser Geolocation API wrapper |
| `src/hooks/useGeolocation.ts` | React hook for geolocation loading/error state |
| `src/components/UseMyLocationButton/` | Shared **Use my location** button ([sidecar](../../src/components/UseMyLocationButton/UseMyLocationButton.md)) |
| `src/routes/channels/edit.tsx` | Channel edit locator field |
| `src/routes/channels/detail.tsx` | Channel detail locator display |
| `src/routes/reference/maidenhead.tsx` | Standalone converter page |
| `src/lib/channelLookup.ts` | Channel search helpers for converter |
| `src/components/MapLocationPicker/` | Slim map picker for converter |

## Inputs and outputs

| Direction | Input | Output |
| --- | --- | --- |
| Locator → coords | 4, 6, 8, or 10-character Maidenhead (case-insensitive) | Centre of the finest specified square |
| Coords → locator | WGS84 lat/lon | Locator at chosen precision (default 6 chars: field + square) |

## Behaviour

- Invalid characters or length → validation error on edit form or converter.
- Southern/western hemispheres: negative lat/lon handled per standard Maidenhead rules.
- Precision: 4 char = field; 6 = square (~5 km); 8 = subsquare; 10 = finer cell.
- Round-trip at fixed precision: `coordsToLocator(locatorToCoords(loc))` should equal normalised `loc` at that precision.

### Geocoding (standalone tool)

- **Mapbox:** uses token from Settings (`localStorage`); never committed to repo.
- **Photon:** keyless OpenStreetMap-backed search via `photon.komoot.io`.
- User can choose provider explicitly; converter defaults to Mapbox when a token exists.

### Device geolocation (#59)

- **Trigger:** explicit **Use my location** button click on channel edit and the standalone converter (not continuous tracking).
- **Permission:** browser prompts for location access; denial shows an inline error without blocking the rest of the form.
- **Privacy:** position is read locally via `navigator.geolocation.getCurrentPosition`; never sent to a server. Coordinates persist only when the user saves a channel (or copies values manually from the converter).
- **Accuracy:** when reported by the browser, shown as dimmed helper text (e.g. `±12 m`).
- **Requirements:** secure context (HTTPS or `localhost`); unavailable over insecure HTTP.

Session-scoped browse position (distance sort, channel detail distance, map “You” marker) is documented in [operator-distance](../operator-distance/README.md) ([#70](https://github.com/pskillen/codeplug-tool/issues/70)).

## Manual verify

### Channel CRUD

1. Import a channel with known coordinates (e.g. Glasgow area).
2. Detail page shows expected 6-char locator (e.g. `IO85`).
3. Edit: change locator to `JO01` → save → coordinates update; map marker moves.
4. Invalid `IO8` → form error, no save.
5. **Use my location** → lat/lon populate, locator updates, map centres, **Use Location** checked.
6. Deny permission → inline error; form still usable.

### Standalone converter

1. Open `/#/reference` → **Maidenhead converter**.
2. Enter `IO85` → lat/lon update live.
3. Change precision to 4 → locator shortens; coords unchanged.
4. Click map → marker and fields update.
5. Look up `G1 1XQ` → coordinates and locator populate (Photon or Mapbox per Settings).
6. **Use my location** → lat/lon and locator update; map recentres.
7. Deny permission → inline error; converter fields still editable.

## Known gaps

- Channel edit: address/postcode lookup not wired (available on standalone converter only).
- Persisting converter results into a codeplug channel: manual copy or use channel edit.

## Related

- [CRUD](crud/README.md) · [bands reference](../reference/bands.md) · [map grid overlay](map/maidenhead-grid.md)
