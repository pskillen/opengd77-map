# BandPill

## Purpose

Displays a coloured pill for a band or receive service derived from channel RX/TX frequency. Amateur bands use solid fill; non-amateur services (broadcast, airband, marine, PMR446) use outline styling.

## Props — `BandPill`

| Prop   | Type                     | Notes                                           |
| ------ | ------------------------ | ----------------------------------------------- |
| `band` | `BandDefinition \| null` | From `bandFromChannel` / `bandFromFrequencyMhz` |
| `size` | `'xs' \| 'sm' \| 'md'`   | Mantine Badge size                              |

## Props — `BandPillForChannel`

| Prop      | Type                |
| --------- | ------------------- |
| `channel` | `Channel`           |
| `size`    | optional Badge size |

## Related

- [bands.ts](../../lib/bands.ts) · [docs/reference/bands.md](../../../docs/reference/bands.md)
