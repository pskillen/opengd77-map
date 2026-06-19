# OpenGD77 — Channels.csv

Generic column reference for `Channels.csv`. Cardinality and display-length limits are radio-profile-specific — see [radios/baofeng-1701.md](radios/baofeng-1701.md).

**Code:** [`columns.ts`](../../../src/lib/import/opengd77/columns.ts) · [`parse.ts`](../../../src/lib/import/opengd77/parse.ts) · [`serialise.ts`](../../../src/lib/export/opengd77/serialise.ts)

## Required headers (app import)

| Header | Reason |
| --- | --- |
| `Channel Name` | Identity; rows without a name are skipped |
| `Latitude` | Map/plot support; must be present as a column |
| `Longitude` | Map/plot support; must be present as a column |

All other columns are optional at import — missing headers yield empty values.

## Column reference

| Vendor header | Internal field | Required (import) | Import rule | Export rule | Round-trip | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Channel Number` | `Channel.number` | No | Trim; strip tabs | As stored | String pass-through | Direct-access number in All-channels zone; see radio profile for range |
| `Channel Name` | `Channel.name` | **Yes** | Trim; skip row if empty | As stored | String pass-through | FK target for zones; case-sensitive |
| `Channel Type` | `Channel.mode` | No | `Analogue`/`Analog` → `fm`; `Digital` → `dmr`; else `other` | All analog modes → `Analogue`; all digital → `Digital`; else passthrough | Lossy for non-FM/DMR | See [channel-modes.md](../channel-modes.md) |
| `Rx Frequency` | `Channel.rxFrequency` | No | Trim; strip tabs | As stored | String pass-through | MHz; CPS accepts `.` or `,` decimal |
| `Tx Frequency` | `Channel.txFrequency` | No | Trim; strip tabs | As stored | String pass-through | MHz |
| `Bandwidth (kHz)` | `Channel.bandwidthKHz` | No | Trim | As stored | String pass-through | Analogue: typically `12.5` or `25`; blank for digital |
| `Colour Code` | `Channel.colourCode` | No | Trim | As stored | String pass-through | Digital only; CPS docs: 0–15 |
| `Timeslot` | `Channel.timeslot` | No | Trim | As stored | String pass-through | Digital: `1` or `2` |
| `Contact` | `Channel.contactName` | No | Trim | As stored | String pass-through | TX talk group name; FK → Contacts.csv; empty or `None` |
| `TG List` | `Channel.rxGroupListName` | No | Trim | As stored | String pass-through | Promiscuous RX list name; FK → TG_Lists.csv; empty or `None` |
| `DMR ID` | `Channel.dmrId` | No | Trim | As stored | String pass-through | Hotspot/repeater ID override |
| `TS1_TA_Tx` | `Channel.vendorExtras['TS1_TA_Tx']` | No | Trim → vendorExtras | From vendorExtras | vendorExtras | Talkaround TS1 |
| `TS2_TA_Tx ID` | `Channel.vendorExtras['TS2_TA_Tx ID']` | No | Trim → vendorExtras | From vendorExtras | vendorExtras | Talkaround TS2 |
| `RX Tone` | `Channel.rxTone` | No | Trim | As stored | String pass-through | Analogue CTCSS/DCS or `None` |
| `TX Tone` | `Channel.txTone` | No | Trim | As stored | String pass-through | Analogue CTCSS/DCS or `None` |
| `Squelch` | `Channel.squelch` | No | Trim | As stored | String pass-through | e.g. `75%`, `Disabled` |
| `Power` | `Channel.power` | No | Trim | As stored | String pass-through | e.g. `Master`, `P2`, `P4`, `P8` |
| `Rx Only` | `Channel.rxOnly` | No | Trim (raw string) | As stored | String pass-through | CPS: `Yes` / `No` — not normalised to boolean in app |
| `Zone Skip` | `Channel.vendorExtras['Zone Skip']` | No | Trim → vendorExtras | From vendorExtras | vendorExtras | Per-zone scan skip; not mapped to `scanSkip` |
| `All Skip` | `Channel.scanSkip` | No | `Yes` → `true` | `wireYesNo(scanSkip)` | Lossless boolean | Global scan skip |
| `TOT` | `Channel.transmitTimeout` | No | Trim | As stored | String pass-through | Seconds; `0` = off; CPS: 0–495 step 15 |
| `VOX` | `Channel.voxEnabled` | No | `Off` or empty → `false`; else `true` | `Off` / `On` | Lossless boolean | CPS accepts other non-`Off` values on import |
| `No Beep` | `Channel.vendorExtras['No Beep']` | No | Trim → vendorExtras | From vendorExtras | vendorExtras | `Yes` / `No` |
| `No Eco` | `Channel.vendorExtras['No Eco']` | No | Trim → vendorExtras | From vendorExtras | vendorExtras | `Yes` / `No` |
| `APRS` | `Channel.aprsConfigName` | No | Trim | As stored | String pass-through | FK → APRS.csv config name; `None` if unused |
| `Latitude` | `Channel.location.lat` | **Column required** | Parse float; invalid → no location | String from location or empty | Lossless when valid pair | Both lat and lon must be finite for `location` |
| `Longitude` | `Channel.location.lon` | **Column required** | Parse float; invalid → no location | String from location or empty | Lossless when valid pair | |
| `Use Location` | `Channel.useLocation` | No | `Yes` → `true` | `wireYesNo(useLocation)` | Lossless boolean | Radio uses stored coordinates |

`Channel.callsign` is derived on import from the first word of `Channel Name` (`extractCallsign`) — not a CSV column.

## Digital channel patterns

**Single-TG TX** — set `Contact`, leave `TG List` empty or `None`:

```csv
13,GB7DA Airdrie,Digital,145.77500,145.17500,,1,2,Scotland TS1,None,...
```

**Promiscuous RX** — `Contact` is `None`, set `TG List`:

```csv
16,GB7GL Glasgow,Digital,430.85000,438.45000,,7,2,None,GB7GL,...
```

## Analogue channel pattern

Leave digital columns empty. FM+DMR repeater sites need **separate rows** for `Analogue` and `Digital`:

```csv
1,GB3CS Motherwell,Analogue,145.75000,145.15000,12.5,,,,,,,,None,103.5,75%,Master,No,No,No,0,Off,No,No,None,55.789,-3.989,Yes
```

## Related

- [File format rules](file-format.md)
- [Contacts](contacts.md) · [TG lists](tg-lists.md)
- [Channel modes](../channel-modes.md)
- [DTMF / APRS](dtmf-aprs.md)
