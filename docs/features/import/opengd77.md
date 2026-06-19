# OpenGD77 CSV import

Deep dive for the first CPS adapter. Entity shapes live in the [data model](../data-model/README.md).

## Classification

`detectKind(fileName, headerRow)` in [`src/lib/import/opengd77/adapter.ts`](../../../src/lib/import/opengd77/adapter.ts):

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

Typical export filenames: `Channels.csv`, `Zones.csv`, `Contacts.csv`, `TG_Lists.csv`. `DTMF.csv` and `APRS.csv` remain **skipped** (header-only on export inside ZIP).

## Channels.csv

Parsed by `parseChannels` in [`src/lib/import/opengd77/parse.ts`](../../../src/lib/import/opengd77/parse.ts). Columns matched by **header name**, not index. Canonical headers in [`columns.ts`](../../../src/lib/import/opengd77/columns.ts).

### Required columns

| Header | Maps to |
| --- | --- |
| `Channel Name` | `Channel.name` |
| `Latitude` | `location.lat` |
| `Longitude` | `location.lon` |

### Optional columns (all round-trip)

| Header | Maps to |
| --- | --- |
| `Channel Number` | `number` |
| `Channel Type` | `mode` — see [channel-modes mapping](../../reference/channel-modes.md): `Analogue`/`Analog` → `fm`, `Digital` → `dmr` |
| `Rx Frequency` / `Tx Frequency` | `rxFrequency` / `txFrequency` |
| `Bandwidth (kHz)` | `bandwidthKHz` |
| `Colour Code` | `colourCode` |
| `Timeslot` | `timeslot` |
| `Contact` | `contactName` |
| `TG List` | `rxGroupListName` |
| `DMR ID` | `dmrId` |
| `RX Tone` / `TX Tone` | `rxTone` / `txTone` |
| `Squelch` | `squelch` |
| `Power` | `power` |
| `Rx Only` | `rxOnly` |
| `All Skip` | `scanSkip` (`Yes` → `true`) |
| `TOT` | `transmitTimeout` |
| `VOX` | `voxEnabled` (`Off` → `false`) |
| `APRS` | `aprsConfigName` |
| `Use Location` | `useLocation` |
| `Zone Skip`, `No Beep`, `No Eco`, `TS1_TA_Tx`, `TS2_TA_Tx ID` | `vendorExtras[header]` |

## Zones.csv

Unchanged — see prior behaviour. `Channel1`…`Channel80` → `sourceMemberNames`.

## Contacts.csv

Parsed by `parseContacts`. Split by `ID Type`:

| `ID Type` | Model |
| --- | --- |
| `Group` | `TalkGroup` |
| `Private` | `Contact` |

| Header | Maps to |
| --- | --- |
| `Contact Name` | `name` |
| `ID` | `number` |
| `TS Override` | `timeslotOverride` |

## TG_Lists.csv

Parsed by `parseRxGroupLists` → `RxGroupList` with `sourceMemberNames` from `Contact1`…`Contact32`. Members are **vendor names** from Contacts.csv (talk groups and/or private contacts).

## Export

Serialisers in [`src/lib/export/opengd77/serialise.ts`](../../../src/lib/export/opengd77/serialise.ts). Export page at `/#/export`.

`Channel Type` export is **lossy**: all analog modes (`fm`, `am`, `ssb-usb`, `ssb-lsb`) wire as `Analogue`; all digital modes (`dmr`, `ysf`, `dstar`, `m17`, `tetra`) wire as `Digital`. See [channel-modes reference](../../reference/channel-modes.md).

## Skip vs error

| Outcome | When |
| --- | --- |
| **Skipped** | `DTMF.csv`, `APRS.csv`, other `unknown` files |
| **Error** | Recognised file fails parse |
| **Recognised** | channels, zones, contacts, rxGroupLists |

## Related

- [Import hub](README.md)
- [Export hub](../export/README.md)
- [Data model](../data-model/README.md)
- [Progress log](opengd77-progress.md) · [Outstanding](opengd77-outstanding.md)
