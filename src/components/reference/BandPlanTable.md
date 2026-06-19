# BandPlanTable

## Purpose

Read-only table of UK amateur band allocations for the Reference → Band plan page.

## Data source

Renders rows from `UK_BANDS` in [`bands.ts`](../../lib/bands.ts) — no duplicated ranges or colours.

## Columns

| Column | Source                                         |
| ------ | ---------------------------------------------- |
| Band   | `BandPill` with `band.label` and `band.color`  |
| Range  | `formatBandRangeMhz(band.minMhz, band.maxMhz)` |
| Colour | Hex value (`band.color`)                       |
| Notes  | `band.notes` or em dash when absent            |

## Related

- [bands.ts](../../lib/bands.ts) · [docs/reference/bands.md](../../../docs/reference/bands.md) · [BandPill](../crud/BandPill.md)
