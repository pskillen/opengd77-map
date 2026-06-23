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

- **Wire name:** `{baseWireName} {memberWireName}` — `baseWireName` = `composeChannelWireName(channel)` (already includes `-F`/`-D` when multi-mode expanded)
- **Contact / TX ref:** the member (`contactRef` on the expanded row)
- **RX group list:** `null` — single-TG row; no RGL on wire

**Collisions:** if a derived name already exists, append ` 2`, ` 3`, … until unique (same rule as multi-mode).

**Length:** export may warn when a derived name exceeds the target profile display limit; truncation is not applied automatically.

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
