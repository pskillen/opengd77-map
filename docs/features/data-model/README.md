# Internal data model

Canonical reference for the vendor-neutral **codeplug** models used across tools. Import and export docs describe ETL at the format boundary; this document describes **what the models are**.

**Tracking:** [codeplug-tool#7](https://github.com/pskillen/codeplug-tool/issues/7) · OpenGD77 population [#38](https://github.com/pskillen/codeplug-tool/issues/38)

## Overview

A **codeplug** is the in-memory working set for one CPS layout: channels, zones, talk groups, RX group lists, and contacts. Tools consume these models — not raw CSV.

For **switchable, named containers** that hold one codeplug each (multi-project workflow), see [codeplug-project/](../codeplug-project/).

```mermaid
erDiagram
  Codeplug ||--o{ Channel : contains
  Codeplug ||--o{ Zone : contains
  Codeplug ||--o{ TalkGroup : contains
  Codeplug ||--o{ RxGroupList : contains
  Codeplug ||--o{ Contact : contains
  Zone }o--o{ Channel : "memberChannelIds"
  Channel }o--o| TalkGroup : "contactRef"
  Channel }o--o| Contact : "contactRef"
  Channel }o--o| RxGroupList : "rxGroupListId"
  RxGroupList }o--o{ TalkGroup : "memberRefs"
  RxGroupList }o--o{ Contact : "memberRefs"
```

Internal relationships use **UUID id** foreign keys. `EntityRef` is a discriminated ref `{ kind: 'talkGroup' | 'contact'; id }` for dual-kind targets (channel TX contact, RX group list members). Wire names from CPS imports live in per-entity import provenance (`meta.imported`) and are resolved to ids at import/merge; export adapters derive wire strings from ids (with provenance fallback for round-trip fidelity). See [import/export](../import-export/README.md) for format-specific column mapping.

**Exception (transitional):** `Channel.aprsConfigName` remains a string FK until APRS/DTMF entities are modelled.

Wire-format mapping lives in the [import/export hub](../import-export/README.md) and per-format references under `docs/reference/<format>/` — not here. Radio-specific limits (zone member caps, feature availability) are format/profile concerns that apply at export time, not in the internal model.

**Source:** [`src/models/codeplug.ts`](../../../src/models/codeplug.ts) · schema version **12** (first-class callsign + export name mode)

## Design principles

| Principle | Detail |
| --- | --- |
| **Radio-agnostic models** | Channels, zones, contacts, etc. have no radio hardware fields. Target radio constraints are applied at export (see [radio profiles](../../reference/opengd77/radios/README.md)). |
| **Stable internal ids** | Every entity has `id: string` (`crypto.randomUUID()` via `newId()`). Relationships use id FKs: `Zone.memberChannelIds`, `Channel.contactRef`, `Channel.rxGroupListId`, `RxGroupList.memberRefs`. |
| **Names are display fields, not FKs** | `Channel.name`, `Zone.name`, etc. are preserved for UI and export labels. `TalkGroup.name` / `Contact.name` uniqueness is a project invariant, not an FK mechanism. |
| **Wire names at import/export only** | Zone and RGL member wire names, channel contact/RGL wire strings live in `meta.imported` provenance. Resolved to ids in `importMerge` / migration; export adapters derive wire strings from ids. |
| **JSON-serialisable** | Plain data objects for persistence and export. |
| **Schema versioned** | `CODEPLUG_SCHEMA_VERSION = 7`; v1–v6 codeplugs migrate on load. |
| **CRUD is vendor-neutral** | Create/edit/delete in the SPA does not enforce radio cardinality (e.g. RX group list member count). Limits apply at import/export per [radio profiles](../../reference/opengd77/radios/README.md). |
| **Vendor-specific fields are additive** | e.g. `opengd77Extras`, import provenance in `meta.imported` — store when useful; importer/exporter decides drop, warn, truncate, or round-trip. Do not reject or cap in CRUD because export might not round-trip. |

## Entities

### `Codeplug`

| Field | Type | Notes |
| --- | --- | --- |
| `channels` | `Channel[]` | |
| `zones` | `Zone[]` | |
| `talkGroups` | `TalkGroup[]` | DMR group calls |
| `rxGroupLists` | `RxGroupList[]` | Promiscuous RX (receive) group lists |
| `contacts` | `Contact[]` | DMR private calls |
| `meta` | `CodeplugMeta` | Import metadata |

### `Channel`

Typed scalar fields use vendor-neutral semantics in the model; CPS wire strings are converted at the import/export boundary (see [import/export](../import-export/README.md)).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Internal |
| `name` | `string` | Human qualifier (town, TG label, etc.) — **not** the full CPS wire string after import |
| `abbreviation` | `string` | Optional shorter export label for the name qualifier — used by name shortening at export |
| `callsign` | `string` | Repeater/site identifier; map default label; edited independently of `name` |
| `exportNameMode` | `ChannelExportNameMode` | How export composes CPS `Channel Name` from `callsign` + `name` — see [channel-name-parsing](../import-export/channel-name-parsing.md) |
| `mode` | `ChannelMode` | Primary/display mode — see [channel-modes reference](../../reference/channel-modes.md) (`fm`, `dmr`, `ysf`, …) |
| `multiMode` | `boolean` | When `true`, channel carries multiple RF mode profiles (opt-in; default `false`) |
| `modeProfiles` | `ChannelModeProfile[]` | Per-mode settings when `multiMode` is enabled; empty when off — see below |
| `rxFrequency`, `txFrequency` | `number \| null` | Integer **Hz**; `null` when unset |
| `contactRef` | `EntityRef \| null` | TX talk group or private contact, by id |
| `rxGroupListId` | `string \| null` | RX group list id |
| `location` | `GeoPoint \| null` | |
| `useLocation` | `boolean` | |
| `bandwidthKHz` | `number \| null` | kHz (e.g. `12.5`, `25`); `null` when unset |
| `colourCode` | `number \| null` | DMR colour code 0–15; `null` when not applicable |
| `timeslot` | `1 \| 2 \| null` | DMR timeslot; `null` when not applicable |
| `dmrId` | `number \| null` | Hotspot/repeater ID override; `null` when unset |
| `rxTone`, `txTone` | `ChannelTone` | CTCSS/DCS value or `'none'` |
| `squelch` | `number \| null` | Percent 0–100; `0` = open/off; `null` = radio default |
| `power` | `number \| null` | Percent 0–100; `null` = radio default |
| `forbidTransmit` | `boolean` | Receive-only / TX forbidden |
| `txAdmit` | `ChannelTxAdmit` | Carrier-idle admit vs always allow TX |
| `aprsConfigName` | `string` | APRS config, by name |
| `voxEnabled` | `boolean` | VOX enabled |
| `transmitTimeout` | `number \| null` | Seconds; `0` = off; `null` when unset |
| `scanSkip` | `boolean` | Exclude from scan |
| `comment` | `string` | Internal operator notes only (`''` default); **not** exported to CHIRP |
| `hideFromMap` | `boolean` | Internal only — exclude from map plots |
| `opengd77Extras` | `Record<string, string>` | OpenGD77-only opaque wire columns preserved for round-trip |
| `meta` | `EntityMeta` | Optional per-entity metadata (see below) |

Channel numbering (a CPS slot index) is **not** stored — it is assigned at export per target format.

#### Multi-mode channels ([#46](https://github.com/pskillen/codeplug-tool/issues/46))

When `multiMode` is `false` (default), behaviour is unchanged: top-level mode-specific fields on `Channel` are authoritative.

When `multiMode` is `true`, shared identity and RF context live on the channel; mode-specific fields live in `modeProfiles`:

| `ChannelModeProfile` field | Type | Notes |
| --- | --- | --- |
| `mode` | `ChannelMode` | Profile mode id |
| `bandwidthKHz` | `number \| null` | |
| `colourCode` | `number \| null` | DMR only |
| `timeslot` | `1 \| 2 \| null` | DMR only |
| `dmrId` | `number \| null` | |
| `rxTone`, `txTone` | `ChannelTone` | Analog modes |
| `squelch` | `number \| null` | |
| `contactRef` | `EntityRef \| null` | |
| `rxGroupListId` | `string \| null` | |

Shared on `Channel`: `name`, `callsign`, `rxFrequency`, `txFrequency`, `location`, `useLocation`, `power`, `forbidTransmit`, `voxEnabled`, `transmitTimeout`, `scanSkip`, `comment`, `hideFromMap`, `opengd77Extras`, `meta`.

Export adapters expand multi-mode logical channels into vendor-specific rows at the boundary (OpenGD77: separate `Analogue` / `Digital` rows — [multi-mode.md](../../reference/opengd77/multi-mode.md)). DM32 native dual-mode mapping: [#67](https://github.com/pskillen/codeplug-tool/issues/67).

**Merging split channels:** Import may collapse paired rows best-effort at the format boundary. Operators can also run **Find merge candidates** on an existing codeplug ([#116](https://github.com/pskillen/codeplug-tool/issues/116)) to detect same-frequency, similar-name single-mode channels and combine them into one `multiMode` channel with per-profile `contactRef` / `rxGroupListId` from model fields. Zone membership is rewired to the survivor channel id.

#### Multi-talkgroup expansion ([#36](https://github.com/pskillen/codeplug-tool/issues/36))

The internal model does **not** add a per-channel multi-talkgroup flag or on-channel TG list. Promiscuous RX is modelled with **`rxGroupListId`** and **`RxGroupList.memberRefs`** — RGL CRUD is the operator surface.

Some CPS formats (e.g. Baofeng DM32 — [#67](https://github.com/pskillen/codeplug-tool/issues/67)) have **no RX group list on the wire** and require one channel row per talk group. For those formats only, export expands each logical digital channel into *n* rows (one per RGL member), and zones fan out accordingly. **OpenGD77 is excluded** — native `TG List` / `TG_Lists.csv` makes lean export correct.

| Concern | Where it lives |
| --- | --- |
| Expansion rules (naming, zone fan-out, import collapse) | Tier-2 [multi-talkgroup-expansion.md](../../reference/multi-talkgroup-expansion.md) |
| Shared implementation | [`src/lib/channelExpansion/`](../../src/lib/channelExpansion/) |
| OpenGD77 | N/A — [opengd77/multi-talkgroup.md](../../reference/opengd77/multi-talkgroup.md) |

Import may best-effort collapse flat per-TG rows into one logical channel + RGL. **Find merge candidates** ([#116](https://github.com/pskillen/codeplug-tool/issues/116)) repairs groups collapse missed.

### `Zone`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Internal |
| `name` | `string` | |
| `memberChannelIds` | `string[]` | Resolved channel ids — authoritative membership |
| `meta` | `EntityMeta` | Optional; `meta.imported.memberWireNames` holds imported zone member channel names |

### `TalkGroup`

DMR group call.

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `name`, `number`, `timeslotOverride` | | (`number` is the DMR ID) |
| `abbreviation` | `string` | Optional shorter export label for name shortening at export |
| `meta` | `EntityMeta` | Optional import provenance |

### `Contact`

DMR private call or DTMF signalling contact.

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `name` | | |
| `identifier` | `string` | DMR ID or DTMF code (wire string) |
| `signalingMode` | `'dmr' \| 'dtmf'` | Signalling family — not RF channel mode |
| `timeslotOverride` | `string` | Optional slot hint for vendor export |
| `meta` | `EntityMeta` | Optional import provenance |

### `RxGroupList`

Named RX (receive) group list driving promiscuous receive. Members are ordered `EntityRef[]` ids (talk groups and/or private contacts). Many-to-many: one list has many members; one member can appear on many lists.

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `name` | | |
| `memberRefs` | `EntityRef[]` | Ordered membership by id |
| `meta` | `EntityMeta` | `meta.imported.memberWireNames` for merge/delta |

### `CodeplugMeta`

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | `number` | Must match `CODEPLUG_SCHEMA_VERSION` (13) after migration |
| `importedAt` | `string \| null` | |
| `sourceFiles` | `string[]` | |

### `EntityMeta` / `ImportedProvenance`

Per-entity import provenance — accessors in [`src/lib/entityProvenance.ts`](../../../src/lib/entityProvenance.ts).

| Field | Type | Notes |
| --- | --- | --- |
| `meta.imported.formatId` | `string` | Source format (e.g. `'opengd77'`) |
| `meta.imported.sourceFile` | `string \| null` | Source CSV filename when known |
| `meta.imported.importedAt` | `string` | ISO-8601 timestamp |
| `meta.imported.memberWireNames` | `string[]` | Ordered wire names for zone/RGL list members (merge/delta) |
| `meta.imported.channelWireName` | `string` | Verbatim CPS channel name at import — **merge identity only**; export uses `composeChannelWireName` |
| `meta.imported.channelWireNames` | `string[]` | All contributing wire names when import collapse merged rows (multi-mode / multi-TG) |
| `meta.imported.contactWireName` | `string` | Channel TX contact wire string — merge/delta (channels only) |
| `meta.imported.rxGroupListWireName` | `string` | Channel RX list wire string — merge/delta (channels only) |

### `EntityRef`

Discriminated ref for dual-kind targets (talk group or private contact):

| Field | Type |
| --- | --- |
| `kind` | `'talkGroup' \| 'contact'` |
| `id` | `string` — entity UUID |

Helpers: [`src/lib/entityRefs.ts`](../../../src/lib/entityRefs.ts) — resolve wire names at import, derive wire strings at export, display labels in UI.

Project-level `CodeplugMeta.importedAt` / `sourceFiles` remain for dashboard and merge bookkeeping.

## Relationship resolution

```mermaid
flowchart LR
  Prov["meta.imported wire names"] --> Resolve["importMerge / migration"]
  Entities["talkGroups, contacts, channels, rxGroupLists"] --> Resolve
  Resolve --> Ids["memberChannelIds, contactRef, rxGroupListId, memberRefs"]
  Ids --> Export["export adapter derives wire strings"]
```

## Related

- [Vendor-agnostic review](vendor-agnostic-review.md) — audit and required changes (#91 / #52 / #53)
- [Import / export](../import-export/README.md)
- [Map — channels](../map/channels.md)
- [Map — zones](../map/zones.md)
