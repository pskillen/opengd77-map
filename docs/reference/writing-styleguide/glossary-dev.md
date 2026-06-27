# Codeplug Tool — developer glossary (authoritative)

Working draft for [#135](https://github.com/pskillen/codeplug-tool/issues/135). **Audience: developers and agents.** This is the single source of truth for what each term *means in our model*. The user-facing glossary on the site will be derived from this, with plain-language definitions and radio-world analogies layered on top.

Canonical model source: `src/models/codeplug.ts` (`CODEPLUG_SCHEMA_VERSION = 17`) and `src/models/codeplugProject.ts`. Where a term has a **wire alias** (the name a CPS/format uses), it's listed so we never confuse internal vs wire vocabulary.

> **Conventions for this glossary**
>
> - **Canonical** = the term we should use in code, docs, and UI prose.
> - **Code id** = the TypeScript identifier.
> - **Wire alias** = what one or more external formats call it (boundary only).
> - Spelling: British English in our own copy (`colour`, `analogue`→ but note mode id is `fm`); wire values keep the format's own spelling (`Color Code`).

---

## 1. Container & project terms


| Canonical            | Code id                        | Definition                                                                                                                                                             | Wire alias |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Codeplug**         | `Codeplug`                     | The radio configuration *content*: channels, zones, talk groups, RX group lists, contacts, plus `meta`. Not persisted alone — always inside a project.                 | —          |
| **Codeplug project** | `CodeplugProject`              | Named, persistent wrapper around one `Codeplug` plus metadata (`name`, `description`, `notes`, `author`, `targetRadios`, timestamps). The unit stored in LocalStorage. | —          |
| **Active project**   | `activeProjectId` (store)      | The currently-selected project being viewed/edited.                                                                                                                    | —          |
| **Target radios**    | `CodeplugProject.targetRadios` | Free-text indicative labels only. **Not** a constraint, **not** an export profile.                                                                                     | —          |
| **Schema version**   | `CODEPLUG_SCHEMA_VERSION`      | Internal model version; migrations run on load (`src/state/codeplugStorage.ts`). Currently **17**. Several docs cite stale numbers (7/12/13) — see §8.                 | —          |


> **Locked distinction:** *Codeplug* (content) vs *codeplug project* (wrapper) vs *active project* (selection). Documented as "locked terminology" in `docs/features/codeplug-project/README.md`. Do not blur these.

---

## 2. Channel terms


| Canonical                     | Code id                                            | Definition                                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Channel**                   | `Channel`                                          | One RF configuration: frequencies (Hz), mode, DMR refs, tones, power, location, flags. May be single-mode or **multi-mode**.                                                |
| **Channel mode**              | `Channel.mode` / `ChannelMode`                     | Primary/display RF mode. Analogue: `fm`, `am`, `ssb-usb`, `ssb-lsb`. Digital: `dmr`, `ysf`, `dstar`, `m17`, `tetra`. Plus `other`. Legacy `analogue`→`fm`, `digital`→`dmr`. |
| **Multi-mode channel**        | `Channel.multiMode` + `modeProfiles[]`             | One logical channel carrying several `ChannelModeProfile` rows (e.g. FM + DMR on one repeater). When `multiMode` is false, top-level channel fields are authoritative.      |
| **Mode profile**              | `ChannelModeProfile`                               | Per-mode field set used when `multiMode === true` (bandwidth, colour code, timeslot, tones, refs, per-profile `opengd77Extras`).                                            |
| **Callsign**                  | `Channel.callsign`                                 | Repeater/site identifier; used as the map label and as a wire-name component.                                                                                               |
| **Channel name**              | `Channel.name`                                     | Display qualifier (e.g. "Glenrothes"). **Not** a relationship key.                                                                                                          |
| **Abbreviation**              | `Channel.abbreviation` / `TalkGroup.abbreviation`  | Optional shorter label used during export name composition/shortening. Export-only.                                                                                         |
| **Export name mode**          | `Channel.exportNameMode` / `ChannelExportNameMode` | How the CPS channel name is composed: `name_only` (default), `callsign_name` (`{callsign} {name}`), `callsign_only`, `callsign_suffix` (`{name} {callsign}`).               |
| **Channel wire name**         | (composed)                                         | The CPS `Channel Name` cell. Composed on export via `composeChannelWireName` from callsign + name + export name mode; split back into parts on import (`channelNaming.ts`). |
| **Timeslot**                  | `ChannelTimeslot` (`1 | 2`)                        | DMR TS1/TS2. Appears on channel, on RX group list **member**, and as a contact override. DMR only.                                                                          |
| **Colour code**               | `Channel.colourCode`                               | DMR colour code 0–15. DMR only. Wire alias: DM32 `Color Code` (American spelling on the wire).                                                                              |
| **Tone**                      | `ChannelTone` (`'none' | string`)                  | CTCSS/DCS tone, or `'none'`. `rxTone`/`txTone`. Analogue only.                                                                                                              |
| **Bandwidth**                 | `Channel.bandwidthKHz`                             | e.g. 12.5 / 25. Primarily analogue.                                                                                                                                         |
| **Power**                     | `Channel.power`                                    | Percentage 0–100, or `null` = radio default. Mapped to a profile power ladder at export.                                                                                    |
| **Squelch**                   | `Channel.squelch`                                  | Percentage 0–100, or `null` = radio default; `0` = open.                                                                                                                    |
| **TX admit**                  | `Channel.txAdmit` / `ChannelTxAdmit`               | `'channel_idle'` (default) or `'allow_tx'`.                                                                                                                                 |
| **Forbid transmit / RX only** | `Channel.forbidTransmit`                           | Receive-only channel. UI label "RX only". (Migrated from legacy `rxOnly`.)                                                                                                  |
| **Scan skip**                 | `Channel.scanSkip`                                 | Exclude this channel when scanning. **Distinct from a Scan list** (see §6). Wire alias: OpenGD77 `All Skip`.                                                                |
| **Hide from map**             | `Channel.hideFromMap`                              | Internal-only display flag; never exported.                                                                                                                                 |
| **Use location**              | `Channel.useLocation`                              | Some radios with GPS will use coords to calculate distance - enabled via this setting. Intenally, whether `location` is used for map plotting.                              |
| **Location**                  | `Channel.location` / `GeoPoint`                    | `{ lat, lon }` or `null`.                                                                                                                                                   |
| **Simplex**                   | (derived)                                          | `rxFrequency === txFrequency`. Not stored; computed (`isSimplex`).                                                                                                          |
| **Duplex / split**            | (derived)                                          | `rxFrequency !== txFrequency`. CHIRP encodes via `Duplex`+`Offset` at the boundary; internal model stores both frequencies in Hz.                                           |
| **DMR ID**                    | `Channel.dmrId`                                    | A talk group or private contact's DMR ID.Alternatively, per-channel setting for user's own DMR ID. DMR only.                                                               |


> **Frequencies are integer Hz** (`number \| null`), not strings. `null` = unset. (`docs/reference/display-conventions.md` is stale on this — see §8.)

---

## 3. Talk groups & contacts (the easily-confused cluster)

This is the highest-risk naming area. Keep these four ideas distinct:


| Canonical           | Code id                            | Definition                                                                                                                                                                     | Wire alias                                                                |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Talk group**      | `TalkGroup`                        | A DMR **group call**. One logical entity per DMR ID. Fields: `name`, `number` (DMR ID, string to keep leading zeros), optional `callType` (`group`/`private`), `abbreviation`. | OpenGD77 `Contacts.csv` row with `ID Type = Group`; DM32 `Talkgroups.csv` |
| **Contact**         | `Contact`                          | A DMR **private call** or a **DTMF** contact. Fields: `name`, `identifier`, `signalingMode` (`dmr`/`dtmf`), `timeslotOverride`.                                                | OpenGD77 `Contacts.csv` row with `ID Type = Private`; DM32 `Contacts.csv` |
| **TX contact**      | `Channel.contactRef` (`EntityRef`) | The channel's transmit target. May reference **either** a talk group **or** a private contact (hence `EntityRef`).                                                             | OpenGD77 `Contact` column; DM32 `TX Contact`                              |
| **Signalling mode** | `Contact.signalingMode`            | `'dmr'` or `'dtmf'`. The signalling family — **not** an RF channel mode.                                                                                                       | —                                                                         |


Key rules:

- **Shared namespace:** `TalkGroup.name` and `Contact.name` must not collide (validation enforces this). Wire-name resolution checks talk groups first, then contacts.
- `**callType`** exists because DM32 splits group vs private in CPS; defaults to `group` on migration.
- "Contact" is overloaded across worlds: the **Contact entity** (private/DTMF), the **TX contact channel field** (often a talk group), and `**Contacts.csv`** (a wire file that, in OpenGD77, holds both talk groups and privates). Always qualify which you mean.

---

## 4. Zones


| Canonical       | Code id                   | Definition                                                                           |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| **Zone**        | `Zone`                    | A named, ordered list of channels for on-radio zone switching.                       |
| **Zone member** | `Zone.memberChannelIds[]` | **Id FKs** to `Channel.id`, ordered. (Provenance keeps `memberWireNames` for merge.) |


Planned ([#164](https://github.com/pskillen/codeplug-tool/issues/164)): zone membership becomes structured (`members: ZoneMemberEntry[]` with `includeInScanList`), plus zone-level `generateScanCarrier` / `scanCarrierFrequencyHz`. Not yet in the model.

> On OpenGD77, a **zone is the scan list** (zone order = scan order). On DM32, zones and scan lists are separate. Don't bake either assumption into the model.

---

## 5. RX group lists & promiscuous receive


| Canonical                   | Code id                 | Definition                                                                                                                                                               | Wire alias                                                                                      |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **RX group list**           | `RxGroupList`           | A named, ordered list of talk groups/contacts a digital channel will receive. Enables promiscuous RX.                                                                    | OpenGD77 `TG List` / `TG_Lists.csv`; DM32 `RX Group List` / `RXGroupLists.csv`                  |
| **RX group list member**    | `RxGroupListMember`     | `{ ref: EntityRef, timeslot?: 1|2|null }`. Ordered. The **per-member timeslot** is the home of slot info ([#142](https://github.com/pskillen/codeplug-tool/issues/142)). |                                                                                                 |
| **Promiscuous receive**     | (concept)               | Listening to multiple talk groups on one digital channel via an RX group list.                                                                                           |                                                                                                 |
| **Channel → RX group list** | `Channel.rxGroupListId` | **Id FK** to `RxGroupList.id`, or `null`. DMR only.                                                                                                                      |                                                                                                 |
| **Promiscuous mode**        | (concept)               | True promiscious mode implies the radio can listen to all talk groups and time slots on a given repeater, without any filtering.                                         | OpenGD77 supports true promiscuous mode. DM32 supports single time slot digital monitor only.   |
| Digital monitor             | (concept)               | Implies removing some or all digital filtering (time slot, talk group ID, etc)                                                                                           | N/A on OpenGD77DM32 supports digital monitor for one time slot (hear all traffic on chosen TS) |


**Naming standard:** canonical is **RX group list** (code: `RxGroupList`). The UI/code currently varies — "RX Group Lists" (nav), "RX list" (map popup), "RX groups" (some detail headings), "RGL" (shorthand in docs), "TG List" (OpenGD77 wire). Pick one display form for the site; keep `RxGroupList` in code. (See §8.)

---

## 6. Scanning


| Canonical                | Code id            | Definition                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scan skip**            | `Channel.scanSkip` | Boolean flag on a channel — exclude from scanning. **This exists today.**                                                                                                                                                                                                                  |
| **Scan list**            | *(not modelled)*   | A first-class scan list entity. **Not in the model.** DM32 `Scan List` column/`Scan.csv` is currently ignored on import. Tracked by [#125](https://github.com/pskillen/codeplug-tool/issues/125) (manual) and [#164](https://github.com/pskillen/codeplug-tool/issues/164) (zone-derived). |
| **Scan carrier channel** | *(planned, #164)*  | Dummy simplex channel a radio sits on while scanning; TX falls to the last heard channel. Export-time synthesis on DM32-style targets.                                                                                                                                                     |


> Do not conflate `**scanSkip`** (shipped boolean) with **Scan list** (not modelled). This is a common trap.

---

Some radios (e.g. DM32) require scan lists. Others (e.g. OpenGD77 radios) the active zone is the scan list.

## 7. Foreign keys, refs, provenance & escape hatches


| Canonical                         | Code id                                  | Definition                                                                                                                                                                   |
| --------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EntityRef**                     | `EntityRef`                              | Discriminated id reference for dual-kind targets: `{ kind: 'talkGroup' | 'contact', id }`. Used by `Channel.contactRef` and `RxGroupListMember.ref`.                         |
| **Internal FK**                   | (rule)                                   | Relationships use **UUID `id`** fields. `name` fields are display/export labels, never relationship keys internally.                                                         |
| **Wire name**                     | (boundary)                               | A case-sensitive name string used by CPS formats as a FK. Resolved to ids at import; composed from ids at export (`entityRefs.ts`). Never an internal FK.                    |
| **Import provenance**             | `meta.imported` / `ImportedProvenance`   | Merge/delta bookkeeping only (e.g. `channelWireName`, `contactWireName`, `rxGroupListWireName`, `memberWireNames`, `chirpDuplexWire`). **Never** the export source of truth. |
| **Repeater directory provenance** | `RepeaterDirectoryProvenance`            | Verify/display snapshot from ukrepeater.net.                                                                                                                                 |
| **opengd77Extras**                | `Channel.opengd77Extras` (+ per-profile) | Approved legacy opaque escape hatch for documented OpenGD77-only columns. Do **not** add new per-format wire bags (`chirpExtras`, `wireColumns`, …).                         |
| **aprsConfigName**                | `Channel.aprsConfigName`                 | Transitional **name-based** FK to an unmodelled APRS config entity. Don't extend the pattern.                                                                                |


Boundary-only parse types (not persisted entities): `ParsedZone`, `ParsedRxGroupList`, `ImportResult`, `ImportEntityKind`.

---

## 8. Naming inconsistencies & doc staleness (fix-list)

These are real inconsistencies found in the codebase/docs. Flagging per the vendor-/documentation-boundary rules; **not fixing here** — listed so the help work and a future cleanup can standardise.

### 8.1 Term spelling / casing to standardise

- **Talk group**: type `TalkGroup`, route `/talk-groups`, nav "Talk groups", DM32 file `Talkgroups.csv`, code `talkGroups`, shorthand "TG". → Canonical prose: **talk group** (two words); "TG" only in export/dictionary contexts.
- **RX group list**: see §5 — many display variants. → Pick one site-wide display string.
- **Contact** overload — see §3. → Always qualify (entity / TX contact / `Contacts.csv`).
- **Colour code** (`colourCode`) vs wire `Color Code`; **analogue** vs mode id `fm` vs OpenGD77 wire `Analogue`. Expected boundary differences — document, don't "fix" the wire.

### 8.2 API naming mismatch

- `ExportOptions.expandRxGroupLists` maps to `expandTalkGroups` inside `channelExpansion/`. Same concept, two names — note in any export docs.

### 8.3 Stale docs (treat as known-wrong until corrected)

- Channel FKs documented as `contactName` / `rxGroupListName` (now `contactRef` / `rxGroupListId`): `docs/reference/opengd77/channels.md`, `docs/features/map/channels.md`, `AGENTS.md:57`.
- `sourceMemberNames` referenced in `docs/reference/opengd77/tg-lists.md`, `zones.md` (now `meta.imported.memberWireNames`).
- `vendorExtras` (now `opengd77Extras`) in several testing/reference docs.
- Frequencies described as strings: `docs/reference/display-conventions.md:7` (actually Hz numbers).
- **Schema version drift:** code = 17; `docs/features/data-model/README.md` cites 7/12/17; persistence README cites 13.
- CRUD README types RGL members as `EntityRef[]` (actually `RxGroupListMember[]`).

### 8.4 Concepts not to conflate (quick table)


| A                                 | B (different thing)                            |
| --------------------------------- | ---------------------------------------------- |
| `scanSkip` (model boolean)        | Scan list (not modelled; DM32 entity)          |
| Talk group (`TalkGroup`)          | Private `Contact` (`signalingMode: 'dmr'`)     |
| Promiscuous RX (RGL on a channel) | Multi-talkgroup expansion (export row fan-out) |
| Timeslot on channel               | Timeslot on RGL member                         |
| Format (OpenGD77)                 | Variant/profile (OpenGD77-1701)                |


---

## 9. Format vs variant vs profile


| Canonical   | Definition                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Format**  | A wire interchange format / CPS dialect (OpenGD77, DM32, CHIRP, qDMR, native YAML). Siblings; none is the default.                                                                               |
| **Variant** | A per-radio sub-flavour *within* a format (OpenGD77-1701, GD-77, MD9600). Applied at export.                                                                                                     |
| **Profile** | The export-boundary object carrying a variant's caps and ladders (`maxChannels`, `nameLimit`, power/squelch ladders, member caps). Lives only in `src/lib/<format>/profiles.ts` and export code. |


---

## 10. Starter canonical pairings (for the user-facing glossary)


| Canonical term             | Code id                        | Example wire aliases                                    |
| -------------------------- | ------------------------------ | ------------------------------------------------------- |
| Talk group                 | `TalkGroup`                    | OpenGD77 `ID Type=Group`; DM32 `Talkgroups.csv`         |
| Private contact            | `Contact` (`dmr`)              | OpenGD77 `ID Type=Private`; DM32 `Contacts.csv`         |
| TX contact (channel field) | `Channel.contactRef`           | OpenGD77 `Contact`; DM32 `TX Contact`                   |
| RX group list              | `RxGroupList`                  | OpenGD77 `TG List`/`TG_Lists.csv`; DM32 `RX Group List` |
| Promiscuous receive        | `rxGroupListId` + `memberRefs` | OpenGD77 "TG list" semantics                            |
| Channel wire name          | composed via `exportNameMode`  | OpenGD77 `Channel Name`; CHIRP `Name`                   |
| Scan skip                  | `scanSkip`                     | OpenGD77 `All Skip`                                     |
| Scan list                  | *(not modelled)*               | DM32 `Scan List`/`Scan.csv`                             |
| Colour code                | `colourCode`                   | DM32 `Color Code`                                       |


