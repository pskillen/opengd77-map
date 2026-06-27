# DM32 — Multi-talkgroup channels

DM32 uses **flat channel rows** for some promiscuous / per-TG layouts (`GB7GL Scotland`, `GB7GL T1`, …) and **native RX group list** names on others (`Scotland`, `ALL`).

## Import

After parse, `mergeImportChannelsMultiTalkgroupBestEffort` collapses rows that match shared stem + distinct TX talk-group heuristics (same as OpenGD77). Many DM32 operator names do not match stems and remain 1:1.

## Export

`expandRxGroupLists: true` with DM32 guards:

- **Do not expand** when the row has both `contactRef` and `rxGroupListId` (native wire had TX contact + named RGL).
- **Do not expand** when the RGL name is `ALL` (monitor sentinel).

Otherwise expand collapsed logical channels back to flat per-TG rows for formats that need it.

Per-member `timeslotOverride` on expanded rows becomes `Time Slot` on each `Channels.csv` row — see [multi-talkgroup expansion](../multi-talkgroup-expansion.md#expanded-row-semantics).

Zone member lists use the same expansion flags so pipe lists match `Channels.csv` wire names.

## Scratch channels

When `zone.exportScratchChannel` and `options.exportScratchChannels` are enabled, export appends companion **scratch** rows for field ad-hoc talk groups ([#163](https://github.com/pskillen/codeplug-tool/issues/163)).

| Concern | Behaviour |
| --- | --- |
| Naming | `{callsign} Scratch` per distinct RF fingerprint among expandable digital zone members |
| Dedup | One row per `(zoneId, rfFingerprint)` |
| TX contact | First talk-group member on the source channel's RX group list |
| Zone fan-out | Scratch wire names auto-appended in zone member lists when the zone flag is set |

Policy and gating: [zone-derived scan lists](../zone-derived-scan-lists.md). Implementation: `appendScratchChannelsForExport` in [`channelExpansion/`](../../../src/lib/channelExpansion/).
