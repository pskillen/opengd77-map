# OpenGD77 CSV import

Adapter behaviour for the first CPS import target. **Column semantics and conversion rules** live in the authoritative [OpenGD77 reference](../../reference/opengd77/README.md); **radio limits** in [radio profiles](../../reference/opengd77/radios/README.md).

Entity shapes: [data model](../data-model/README.md).

## Adapter

| Item | Location |
| --- | --- |
| Adapter | [`src/lib/import/opengd77/adapter.ts`](../../../src/lib/import/opengd77/adapter.ts) |
| Parsers | [`parse.ts`](../../../src/lib/import/opengd77/parse.ts) |
| Headers | [`columns.ts`](../../../src/lib/import/opengd77/columns.ts) |

Today's adapter is calibrated to the [Baofeng 1701 profile](../../reference/opengd77/radios/baofeng-1701.md) (80 zone members, 32 TG list members).

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
| `channels` | `parseChannels` | `Channel[]` |
| `zones` | `parseZones` | `ParsedZone[]` → resolved to `Zone[]` with `memberChannelIds` |
| `contacts` | `parseContacts` | `TalkGroup[]` + `Contact[]` |
| `rxGroupLists` | `parseRxGroupLists` | `ParsedRxGroupList[]` → `RxGroupList[]` |

Zone member names resolve to channel ids via `resolveZoneMembers` in [`codeplug.ts`](../../../src/lib/codeplug.ts) — case-sensitive, first-wins on duplicate channel names.

## Skip vs error

| Outcome | When |
| --- | --- |
| **Skipped** | `DTMF.csv`, `APRS.csv`, other `unknown` files |
| **Error** | Recognised file fails parse (missing required columns, empty CSV) |
| **Recognised** | channels, zones, contacts, rxGroupLists |

Full skip/error table: [reference hub](../../reference/opengd77/README.md#skip-vs-error).

## Wire format reference

| CPS file | Reference |
| --- | --- |
| `Channels.csv` | [channels.md](../../reference/opengd77/channels.md) |
| `Zones.csv` | [zones.md](../../reference/opengd77/zones.md) |
| `Contacts.csv` | [contacts.md](../../reference/opengd77/contacts.md) |
| `TG_Lists.csv` | [tg-lists.md](../../reference/opengd77/tg-lists.md) |
| `DTMF.csv` / `APRS.csv` | [dtmf-aprs.md](../../reference/opengd77/dtmf-aprs.md) |

## Related

- [Import hub](README.md)
- [Export hub](../export/README.md)
- [Progress log](opengd77-progress.md) · [Outstanding](opengd77-outstanding.md)
