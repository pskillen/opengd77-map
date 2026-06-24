# Multi-talkgroup expansion

Domain rules for expanding one **logical digital channel** (with an RX group list) into multiple export rows — one per talk group (or contact) on the wire. Applies to formats that **do not** support promiscuous RX / RX group lists natively (e.g. Baofeng DM32 — [#67](https://github.com/pskillen/codeplug-tool/issues/67)).

**Not applicable to OpenGD77** — OpenGD77 CPS carries `TG List` and `TG_Lists.csv` natively; lean export (one channel row + list reference) is correct. See [opengd77/multi-talkgroup.md](opengd77/multi-talkgroup.md).

**Tracking:** [codeplug-tool#36](https://github.com/pskillen/codeplug-tool/issues/36)

**Implementation:** [`src/lib/channelExpansion/`](../../src/lib/channelExpansion/) — orthogonal to multi-mode expansion ([#46](https://github.com/pskillen/codeplug-tool/issues/46)).

---

## Internal model (source of truth)

Operators model promiscuous RX with existing fields — no per-channel multi-talkgroup flag:

| Field | Role |
| --- | --- |
| `Channel.rxGroupListId` (or per-profile `rxGroupListId` when `multiMode`) | Which RX group list drives expansion |
| `RxGroupList.memberRefs` | Ordered talk groups and/or private contacts to expand |
| `Channel.contactRef` | TX contact on lean rows; cleared on expanded rows |

RGL CRUD is how operators manage the talk group set. See [data-model README](../features/data-model/README.md).

---

## When to expand (export)

Enable TG expansion (`ExportOptions.expandRxGroupLists`) only when the **target format cannot represent RGLs** on the wire.

| Condition | Action |
| --- | --- |
| Digital/DMR row with resolvable `rxGroupListId` and ≥1 expandable member | Emit one row per member |
| Analog or non-DMR row | Never expand |
| No RGL or zero members after filter | Emit one unchanged row; optional warning |
| Combined with multi-mode | Mode expand first, then TG expand on digital rows → **m×n** |

### Member filter (`ExportOptions.expandRxGroupListMembers`)

| Value | Members expanded |
| --- | --- |
| `all` (default) | All `memberRefs` (talk groups and private contacts) |
| `talkGroupsOnly` | `EntityRef` with `kind: 'talkGroup'` only; skipped private contacts may emit a warning |

### Expanded row semantics

Each expanded row is one site × one member:

- **Wire name:** composed by `multiTalkGroupExportNameMode` (default `callsign_tg_abbrev`) — see [Wire name modes](#wire-name-modes). Legacy `append` mode uses `{baseWireName} {memberWireName}`.
- **Contact / TX ref:** the member (`contactRef` on the expanded row)
- **RX group list:** `null` — single-TG row; no RGL on wire
- **Timeslot:** when the member has `timeslotOverride`, expanded row `timeslot` reflects it; otherwise inherits lean channel / mode-profile slot. Relevant for formats that store slot on the channel row (e.g. DM32 `Time Slot`).

**Collisions:** if a derived name already exists, append ` 2`, ` 3`, … until unique (same rule as multi-mode). TG-first modes aim to keep talk-group identity in the name so disambiguation suffixes are not needed.

**Length:** when [name shortening](../features/import-export/name-shortening.md) is enabled, TG-first modes protect the trailing talk-group token(s) while shortening the leading site/callsign portion only. Modes auto-escalate (`callsign_tg_abbrev` → `suffix_tg_abbrev` → `suffix_tg_number`) when the composed name still exceeds `maxNameLength`.

### Wire name modes

Controlled by `ExportOptions.multiTalkGroupExportNameMode` (Settings / export panel). Default **`callsign_tg_abbrev`**.

| Mode | Composed wire name (before length trim) | Example |
| --- | --- | --- |
| `callsign_tg_abbrev` | `{callsign} {tgAbbrevOrName}` | `GB7GL Sco TS2` |
| `callsign_tg` | `{callsign} {tgLabel}` | `GB7GL Scotland TS2` |
| `callsign_name_tg` | `{callsign} {name} {tgLabel}` | `GB7GL Glasgow Scotland TS2` |
| `suffix_tg_abbrev` | `{callsign2} {tgAbbrevOrName}` | `GL Sco TS2` |
| `suffix_tg_number` | `{callsign2} {number[/ts]}` — failsafe | `GL 950/2` |
| `append` | **Legacy** — `{baseWireName} {memberLabel}` | `GL Glas Scotland TS2` |

`callsign` includes multi-mode `-F`/`-D` suffix when present on the expanded row. `number[/ts]` uses `TalkGroup.number` and `timeslotOverride` (`Slot 1` → `1`). Implementation: `src/lib/channelExpansion/multiTalkGroupWireName.ts`.

**Tracking:** [codeplug-tool#153](https://github.com/pskillen/codeplug-tool/issues/153) (follow-up to [#36](https://github.com/pskillen/codeplug-tool/issues/36)).

---

## Zone membership

Zones reference **logical channel ids** internally (`memberChannelIds`). When TG expansion runs on export, each zone member expands to **all** derived wire names for that logical channel.

If fan-out would exceed the target profile zone member cap, export truncates at the boundary and emits a warning.

---

## Import re-normalisation (best-effort)

Flat per-TG rows from a denormalised CPS may collapse into one logical channel when:

- Same RX and TX frequency (Hz)
- Same location (lat/lon) when both set
- Same digital mode, colour code, and timeslot when set
- Compatible name stems after stripping `{base} {member}` suffixes
- Distinct talk-group `contactRef` per row

**Result:** one logical channel with `contactRef = null` (promiscuous pattern) and `rxGroupListId` pointing at an existing or newly matched RGL with collected `memberRefs`.

**Ambiguity:** leave as separate channels — no regression.

Operators can also run **Find merge candidates** ([#116](https://github.com/pskillen/codeplug-tool/issues/116)) to repair groups import collapse missed.

---

## Related

- [Multi-mode expansion](channel-modes.md) — orthogonal axis ([#46](https://github.com/pskillen/codeplug-tool/issues/46))
- [Adding a new vendor](../features/import-export/adding-a-new-vendor.md) — design-time checklist
- [OpenGD77 multi-talkgroup](opengd77/multi-talkgroup.md) — N/A for OpenGD77
- [DM32 stub](../features/import-export/dm32/README.md) — next consumer ([#67](https://github.com/pskillen/codeplug-tool/issues/67))
