# Baofeng 1701 / Retevis RT-84 — OpenGD77 profile

Radio profile for the **Baofeng DM-1701** (also sold as **Retevis RT-84**) running OpenGD77 firmware. This is the **first documented profile** and matches today's shipped import/export adapter constants.

**Hardware family:** TYT MD-UV380 / Retevis RT-3S / Baofeng DM-1701 / Retevis RT-84 (shared OpenGD77 CPS and codeplug format).

## Sources

- [G4EML CSV Export and Import Features (PDF)](https://www.opengd77.com/downloads/PC_CPS/Latest/OpenGD77_CPS_CSV%20Features.pdf)
- Operator layout conventions in `dmr-programming` [1701 codeplug CSV skill](file:///Users/patricks/git_personal/dmr-programming/.cursor/skills/1701-codeplug-csv/SKILL.md)
- Sample exports: `1701/opengd77-cps-export/` in `dmr-programming` repo
- Shipped adapter: [`columns.ts`](../../../../src/lib/import/opengd77/columns.ts) — `zoneMemberHeaders(80)`, `rxGroupListMemberHeaders(32)`

## Capacity and cardinality

| Constraint | Value | Source | Notes |
| --- | --- | --- | --- |
| Max channels | 1023 | G4EML CPS | `Channel Number` unique integer 1–1023; gaps allowed |
| Zone members | 80 | CPS export / adapter | `Channel1`…`Channel80` |
| TG list members | 32 | CPS export / adapter | `Contact1`…`Contact32` |
| Contacts | ~100+ | CPS / operator practice | No hard app limit today |
| Channel name display | ~16 chars | CPS UI | Longer names may truncate on radio LCD |
| TOT range | 0–495, step 15 | G4EML CPS | `0` = off |
| Colour code | 0–15 | G4EML CPS | Digital channels |
| Append CSV renumber | Ignores channel numbers | G4EML CPS | Append mode compacts and renumbers sequentially |

## Feature availability

| Feature | 1701 support | App modelling | Notes |
| --- | --- | --- | --- |
| DMR digital | Yes | Full | `Channel Type` = `Digital` |
| Analogue FM | Yes | Full | `Channel Type` = `Analogue`; no dual-mode row |
| Promiscuous RX (TG lists) | Yes | Full | `TG List` on channel + `TG_Lists.csv` |
| APRS | Yes (firmware) | **Partial** | `Channels.APRS` name round-trips; `APRS.csv` body not modelled |
| DTMF sequences | Yes (firmware) | **Not modelled** | `DTMF.csv` exported header-only |
| Hotspot / talkaround | Yes | vendorExtras | `TS1_TA_Tx`, `TS2_TA_Tx ID` in vendorExtras |
| Airband / AM | **No** | N/A | OpenGD77 on 1701 does not carry AM airband — layout convention |
| YSF / D-STAR / M17 | No native CPS columns | Lossy export | Collapse to `Digital` if set in internal model |

## Layout conventions (1701)

These are operator/layout choices, not CSV column differences:

- **Lean model** — one channel row per repeater/site, not one row per repeater×talk-group; promiscuous TG lists handle RX.
- **Zone = scan** — no separate scan-list file; zone member order is scan order.
- **No dual mode** — FM+DMR repeater needs separate `Analogue` and `Digital` rows.
- **Naming** — callsign + qualifier (e.g. `GB7GL Glasgow`); case-sensitive FKs across files.
- **Independent TX TG** — on the radio, RF channel and TX talk group are independently selectable (behaviour not stored in CSV).

## Adapter calibration notes

Today's code hard-codes this profile:

| Constant | Value | Location |
| --- | --- | --- |
| Zone member headers | 80 | `zoneMemberHeaders(80)` in `columns.ts` |
| TG list member headers | 32 | `rxGroupListMemberHeaders(32)` in `columns.ts` |
| Export profile picker | Not implemented | Export always uses 1701 column counts |

## Known gaps vs generic reference

| Topic | Status |
| --- | --- |
| `Zone Skip` vs `All Skip` | `All Skip` → `scanSkip`; `Zone Skip` in vendorExtras only |
| `Rx Only` normalisation | Stored as raw string, not `Yes`/`No` boolean |
| Unresolved zone members | Preserved in `sourceMemberNames`; no import warning UI |
| Other OpenGD77 radios | Limits assumed same as 1701 until validated — file issues when exports differ |

## Related

- [Radio profiles hub](README.md)
- [Generic OpenGD77 reference](../README.md)
- [DTMF / APRS](../dtmf-aprs.md)
