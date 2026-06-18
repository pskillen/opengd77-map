# Maidenhead locator conversion

Tool-internal conversion between Maidenhead grid locators and WGS84 coordinates for channel location fields.

**Tracking:** [codeplug-tool#11](https://github.com/pskillen/codeplug-tool/issues/11) (location tools)

## Purpose

Channels store `location: { lat, lon }` and `useLocation`. The CRUD UI will:

- **Display** a Maidenhead locator derived from stored coordinates on list/detail pages.
- **Accept** locator input on the channel edit form and convert to lat/lon on save.

This doc covers conversion behaviour only — not map rendering (see [map/](map/README.md)).

## Code anchors

| Path | Role |
| --- | --- |
| `src/lib/maidenhead.ts` | `locatorToCoords`, `coordsToLocator` |
| `src/routes/channels/edit.tsx` | Locator input field |
| `src/routes/channels/detail.tsx` | Locator display |

## Inputs and outputs

| Direction | Input | Output |
| --- | --- | --- |
| Locator → coords | 4, 6, 8, or 10-character Maidenhead (case-insensitive) | Centre of the finest specified square |
| Coords → locator | WGS84 lat/lon | Locator at chosen precision (default 6 chars: field + square) |

## Behaviour

- Invalid characters or length → validation error on edit form.
- Southern/western hemispheres: negative lat/lon handled per standard Maidenhead rules.
- Precision: 4 char = field; 6 = square (~5 km); 8 = subsquare; 10 = finer cell.
- Round-trip at fixed precision: `coordsToLocator(locatorToCoords(loc))` should equal normalised `loc` at that precision.

## Manual verify

1. Import a channel with known coordinates (e.g. Glasgow area).
2. Detail page shows expected 6-char locator (e.g. `IO85`).
3. Edit: change locator to `JO01` → save → coordinates update; map marker moves.
4. Invalid `IO8` → form error, no save.

## Known gaps

- Address/postcode lookup: not in scope for initial CRUD slice.
- Map click-to-set: separate from locator math; updates coords then display refreshes locator.

## Related

- [CRUD](crud/README.md) · [bands reference](../reference/bands.md)
