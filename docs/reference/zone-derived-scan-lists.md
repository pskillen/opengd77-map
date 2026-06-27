# Zone-derived scan lists and scratch channels

Export-time synthesis of **scan lists**, **scan carrier channels**, and **scratch channels** from zone configuration. Complements future manual `ScanList` CRUD ([#125](https://github.com/pskillen/codeplug-tool/issues/125)) — zone-derived lists are automated from membership; manual lists remain for operator-defined layouts.

**Tracking:** [#164](https://github.com/pskillen/codeplug-tool/issues/164) (scan lists), [#163](https://github.com/pskillen/codeplug-tool/issues/163) (scratch channels)

**Implementation:** [`src/lib/zoneDerivedScanLists/`](../../src/lib/zoneDerivedScanLists/), [`src/lib/channelExpansion/`](../../src/lib/channelExpansion/) (`appendScratchChannelsForExport`)

---

## Two-level gating

| Layer | Where | Purpose |
| --- | --- | --- |
| **Zone model** (persisted) | Zone CRUD | Per-zone intent: emit scratch? emit scan list/carrier? |
| **Export options** (session / localStorage) | DM32 export panel | Master switches: honour zone scratch flags? honour zone scan flags? |

Effective at export:

```text
emitScratch(zone)  = zone.exportScratchChannel === true
                  && options.exportScratchChannels !== false

emitScan(zone)     = zone.exportScanList === true
                  && options.exportZoneDerivedScanLists !== false
```

**Defaults:** zone flags **off** (opt-in per zone). Export master toggles **on** (opt-out at download).

---

## Zone model fields

| Field | Type | Notes |
| --- | --- | --- |
| `members` | `ZoneMemberEntry[]` | Ordered membership; replaces legacy `memberChannelIds` |
| `members[].channelId` | `string` | Internal channel id FK |
| `members[].includeInScanList` | `boolean?` | When `false`, channel stays in zone but is omitted from derived scan lists. Default **true** when unset |
| `exportScratchChannel` | `boolean?` | When true, DM32-style export may emit scratch rows for this zone |
| `exportScanList` | `boolean?` | When true, DM32-style export may emit `Scan.csv`, scan carrier, and wire `Scan List` FK |
| `scanCarrierFrequencyHz` | `number \| null` | Optional carrier RF override; export default **145.500 MHz** simplex |

Scratch is **zone-orchestrated** — there is no `RxGroupList.includeScratchChannel` flag.

---

## Member filtering for scan lists

A channel is included in a zone-derived scan list when:

1. `members[].includeInScanList !== false`, and
2. `Channel.scanSkip !== true`

If no members pass the filter, export skips the scan list for that zone and emits a warning.

DM32 caps scan list membership at **16** per list at export (truncate + warn). CRUD has no member cap.

---

## Scratch channel semantics

When scratch export is enabled for a zone:

- One scratch row per distinct **RF fingerprint** among expandable digital zone members (dedup per `zoneId` + fingerprint).
- Wire name: `{callsign} Scratch` (from the source channel's callsign).
- TX contact: first talk-group member on the channel's RX group list.
- Scratch rows are **export-only synthesis** in v1 — not persisted until re-import recognises them.

See [DM32 multi-talkgroup — scratch](dm32/multi-talkgroup.md#scratch-channels).

---

## Scan carrier semantics

When scan export is enabled for a zone:

- **Scan list name** = zone `name`.
- **Carrier channel name** = `{zone.name} Scan`.
- Carrier is injected as the **first** zone member on export; `Channels.csv` `Scan List` column on the carrier points at the list name.
- `Scan.csv` `Scan Tx Mode` = `Last Actived Channel` (CPS wire spelling).

Wire column details: [DM32 scan lists](dm32/scan-lists.md).

---

## Format behaviour

| Target | `exportScratchChannel` | `exportScanList` | `includeInScanList` |
| --- | --- | --- | --- |
| **DM32** | Honoured when master toggle on | Honoured when master toggle on | Filters scan list members |
| **OpenGD77** | Ignored | Ignored (zone = scan) | Ignored |
| **CHIRP** | Ignored | **Excluded** — no scan list mechanism; only per-channel `scanSkip` | Ignored |

**Vendor boundaries:** zone and member configuration are unlimited in CRUD. Radio caps and wire mapping apply at import/export only. Do not read OpenGD77 `Zone Skip` wire columns for internal modelling.

---

## Related

- [Multi-talkgroup expansion](multi-talkgroup-expansion.md) — RX list fan-out and zone member wire names
- [DM32 scan lists](dm32/scan-lists.md) — `Scan.csv` wire layout
- [Data model — Zone](../features/data-model/README.md#zone)
- [Import/export hub](../features/import-export/README.md)
