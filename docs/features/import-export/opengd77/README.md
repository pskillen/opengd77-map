# OpenGD77 CSV import / export

Adapter behaviour for the **first shipped import/export format** (one of several — see the [hub](../README.md) for siblings DM32, qDMR, CHIRP, …). **Column semantics and conversion rules** live in the authoritative [OpenGD77 reference](../../../reference/opengd77/README.md); **per-radio variant limits** in [radio profiles](../../../reference/opengd77/radios/README.md).

Entity shapes: [data model](../../data-model/README.md).

OpenGD77 CPS CSV is **one interchange format shared by many radios**. Import/export adapters are format-level; radio-specific limits (member column counts, feature availability) are profile-level at export time ([#72](https://github.com/pskillen/codeplug-tool/issues/72)). Today's exporter uses the [Baofeng 1701 profile](../../../reference/opengd77/radios/baofeng-1701.md) without a profile picker UI.

## Adapter

| Item | Location |
| --- | --- |
| Import adapter | [`src/lib/import/opengd77/adapter.ts`](../../../../src/lib/import/opengd77/adapter.ts) |
| Import parsers | [`parse.ts`](../../../../src/lib/import/opengd77/parse.ts) |
| Import headers | [`columns.ts`](../../../../src/lib/import/opengd77/columns.ts) |
| Export serialisers | [`src/lib/export/opengd77/`](../../../../src/lib/export/opengd77/) |

## Classification

`detectKind(fileName, headerRow)`:

| Signal | Result |
| --- | --- |
| Filename contains `channel` (case-insensitive) | `channels` |
| Filename contains `zone` | `zones` |
| Filename contains `contact` (not `dtmf`) | `contacts` |
| Filename contains `tg_list` or `tg list` | `rxGroupLists` |
| Headers include `Contact Name` + `ID Type` | `contacts` |
| Headers include `TG List Name` | `rxGroupLists` |
| Headers include `Channel Name` + `Latitude` | `channels` |
| Headers include `Zone Name` | `zones` |
| Otherwise | `unknown` → skipped |

Typical filenames: `Channels.csv`, `Zones.csv`, `Contacts.csv`, `TG_Lists.csv`. `DTMF.csv` and `APRS.csv` are **skipped** on import.

## Parse flow

| File kind | Parser | Model output |
| --- | --- | --- |
| `channels` | `parseChannels` | `Channel[]` (wire `Channel Number` column ignored) |
| `zones` | `parseZones` | `ParsedZone[]` → resolved to `Zone[]` with `memberChannelIds` |
| `contacts` | `parseContacts` | `TalkGroup[]` + `Contact[]` |
| `rxGroupLists` | `parseRxGroupLists` | `ParsedRxGroupList[]` → `RxGroupList[]` |

Zone member names resolve to channel ids via `resolveZoneMembers` in [`codeplug.ts`](../../../../src/lib/codeplug.ts) — case-sensitive, first-wins on duplicate channel names.

## Skip vs error

| Outcome | When |
| --- | --- |
| **Skipped** | `DTMF.csv`, `APRS.csv`, other `unknown` files |
| **Error** | Recognised file fails parse (missing required columns, empty CSV) |
| **Recognised** | channels, zones, contacts, rxGroupLists |

Full skip/error table: [reference hub](../../../reference/opengd77/README.md#skip-vs-error).

## Export

- **Per-file download:** `Channels.csv`, `Zones.csv`, `Contacts.csv`, `TG_Lists.csv`
- **ZIP:** all six CPS files; `DTMF.csv` and `APRS.csv` are header-only (not modelled)
- **`Channel Number`:** assigned sequentially (1..n in channel list order) when serialising `Channels.csv` — not stored in the internal model. Original import numbers are not preserved on round-trip.

Round-trip test: [`roundtrip.test.ts`](../../../../src/lib/export/opengd77/roundtrip.test.ts).

## Wire format reference

| CPS file | Reference |
| --- | --- |
| `Channels.csv` | [channels.md](../../../reference/opengd77/channels.md) |
| `Zones.csv` | [zones.md](../../../reference/opengd77/zones.md) |
| `Contacts.csv` | [contacts.md](../../../reference/opengd77/contacts.md) |
| `TG_Lists.csv` | [tg-lists.md](../../../reference/opengd77/tg-lists.md) |
| `DTMF.csv` / `APRS.csv` | [dtmf-aprs.md](../../../reference/opengd77/dtmf-aprs.md) |

## Related

- [Import / export hub](../README.md)
- [Outstanding debt](../outstanding.md)
- [Progress log](progress.md)
