# BandPill

## Purpose

Displays a coloured pill for a UK amateur band derived from channel RX/TX frequency.

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
