# Baofeng DM32 CPS CSV import/export

**Status:** In progress — tracking [#67](https://github.com/pskillen/codeplug-tool/issues/67)

Baofeng DM-32UV stock CPS exports a **multi-file CSV bundle** (channels, zones, talk groups, contacts, RX group lists, DTMF contacts, scan lists). This adapter maps at the import/export boundary; the internal [codeplug model](../../data-model/README.md) stays format-agnostic.

## Implementation

| Layer | Location |
| --- | --- |
| Wire reference (tier 3) | [`docs/reference/dm32/`](../../../reference/dm32/README.md) |
| Import adapter | `src/lib/import/dm32/` |
| Export adapter | `src/lib/export/dm32/` |
| Radio profile | `src/lib/dm32/profiles.ts` |
| Fixtures | `test-data/baofeng-dm32/v1.60/`, `src/test/dm32/` |

## Expandable channels (DM32 vs OpenGD77)

| Axis | DM32 | OpenGD77 |
| --- | --- | --- |
| Multi-mode | Native `Fixed Analog` / `Fixed Digital` on one row (`expandModes: false`) | Separate `-F`/`-D` rows (`expandModes: true`) |
| Multi-talkgroup | Flat per-TG channel rows (`expandRxGroupLists: true`) | Native `TG List` + `TG_Lists.csv` |

See [adding-a-new-vendor.md § Expandable channels](../adding-a-new-vendor.md) and [dm32/multi-talkgroup.md](../../../reference/dm32/multi-talkgroup.md).

## #67 scope gaps

| Item | Status |
| --- | --- |
| `Scan.csv` / channel `Scan List` | Deferred — [#125](https://github.com/pskillen/codeplug-tool/issues/125) |
| `DMR-ID.csv` / channel `DMR ID` | Accepted lossy gap |

Progress: [dm32-progress.md](dm32-progress.md) · Outstanding: [dm32-outstanding.md](dm32-outstanding.md)

## Related

- [Import / export hub](../README.md)
- [adding-a-new-vendor.md](../adding-a-new-vendor.md)
