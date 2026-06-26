# Multi-timeslot talk groups (OpenGD77)

How OpenGD77 CPS represents **one logical DMR talk group** across **two repeater time slots**, and how Codeplug Tool normalises that at import, models it internally, and expands it again at export.

**Tracking:** [codeplug-tool#142](https://github.com/pskillen/codeplug-tool/issues/142)

**Fidelity stance:** [import/export fidelity contract](../../features/import-export/import-export-fidelity-contract.md) — **Tier 3 semantic round-trip** is guaranteed; **byte reproduction is not**.

---

## Problem

OpenGD77 encodes DMR timeslots in several wire shapes:

| Wire shape | Example | Where |
| --- | --- | --- |
| Slot suffix on contact name | `Scotland TS1`, `Scotland TS2` | `Contacts.csv`, `TG_Lists.csv` |
| `TS Override` column | `1` / `2` on a single contact row | `Contacts.csv` |
| Channel timeslot column only | Channel on TS2, contact `FIRE 901` with no suffix | `Channels.csv` |

Operators think in **one logical talk group** (e.g. `Scotland` / DMR ID `2355`) with **per-repeater slot** chosen on RX group list membership — not as duplicate CRUD entities.

---

## Internal model

| Concept | Storage |
| --- | --- |
| Logical talk group | `TalkGroup` — one row per DMR ID / name stem |
| Per-slot usage | `RxGroupListMember.timeslot` (`1` or `2`) on RGL membership |
| Channel TX contact | `Channel.contactRef` → logical `TalkGroup` id (no slot on the channel) |
| Private contacts | `Contact.timeslotOverride` unchanged (out of scope for #142) |

`TalkGroup.timeslotOverride` was removed in schema v17; slots live on RGL members only.

---

## Import (OpenGD77)

Post-merge pass `collapseTalkGroupTimeslotDuplicates` ([`src/lib/import/opengd77/collapseTalkGroupTimeslotDuplicates.ts`](../../../src/lib/import/opengd77/collapseTalkGroupTimeslotDuplicates.ts)):

1. Group talk groups with the **same `number`** (DMR ID).
2. When all names share one **stem** after stripping `\s*T[12]$` / `\s*TS[12]$`, collapse to a survivor with the stem name.
3. Rewire `rxGroupLists[].memberRefs` with inferred `timeslot` from wire suffix.
4. Rewire `channels[].contactRef` and `modeProfiles[].contactRef` to the survivor.
5. Re-resolve channel contacts from import wire names after collapse.

Ambiguous families (same DMR ID, incompatible stems) stay separate; optional import warning.

**Manual repair:** Talk groups list → **Find merge candidates** runs the same family heuristic for duplicates import collapse missed.

---

## Export (OpenGD77)

Slot demand is **RGL `memberRefs` only** ([`talkGroupTimeslotExpansion.ts`](../../../src/lib/channelExpansion/talkGroupTimeslotExpansion.ts)):

| Output | Rule |
| --- | --- |
| `Contacts.csv` | One row per demanded `(talkGroupId, timeslot)` as `{logicalName} T{slot}` with `TS Override` = `1` or `2`. Logical TGs with no RGL slot demand export as a single plain row. |
| `TG_Lists.csv` | Member cells use expanded wire names from the map above. |
| `Channels.csv` `Contact` column | **Logical** talk group name (no slot suffix). |

Export serialises from **model fields** — no replay of `meta.imported.*Wire` provenance ([no-wire-stash round-trip](../../../.cursor/rules/no-wire-stash-roundtrip.mdc)).

---

## Accepted losses (Tier 3)

Documented slippage when re-exporting after import normalisation:

| Case | Behaviour |
| --- | --- |
| Suffix style `TS1` → `T1` | Export uses `T{slot}` compose rule; semantic model unchanged. |
| Channel TX used slot-suffixed contact only in CPS, not in any RGL | Collapses to logical TG; re-export may not recreate per-slot Contacts rows unless RGL members carry slots. |
| `FIRE 901` + channel TS column only | Slot not stored unless reflected in RGL membership. |
| Contacts row count / ordering | May differ from original CPS file; model equality is the guarantee. |

---

## Test fixtures

| Fixture | Role |
| --- | --- |
| Hand-authored roundtrip tests ([`roundtrip.test.ts`](../../../src/lib/export/opengd77/roundtrip.test.ts)) | Tier 1/3 — logical TG + RGL slots → expanded wire names + export→re-import model equality. |
| `test-data/opengd77/r2025.02.23.01/` | **Import torture** — real operator export; asserts sane normalised model and stable semantic re-import, **not** byte-identical CSV ([`opengd77RoundTrip.system.test.ts`](../../../src/test/system/opengd77RoundTrip.system.test.ts)). |

---

## Related

- [contacts.md](contacts.md) — `Contacts.csv` columns
- [tg-lists.md](tg-lists.md) — `TG_Lists.csv` columns
- [Import/export fidelity contract](../../features/import-export/import-export-fidelity-contract.md)
- [Talk group timeslot expansion progress](../../features/data-model/talk-group-timeslot-expansion-progress.md)
