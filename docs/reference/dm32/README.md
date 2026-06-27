# Baofeng DM32 CPS CSV reference

Authoritative reference for **Baofeng DM-32UV stock CPS** CSV exports (v1.60+). One wire format among several at the import/export boundary.

**Tracking:** [codeplug-tool#67](https://github.com/pskillen/codeplug-tool/issues/67)

## File inventory (v1.60)

| File | Reference | #67 import | #67 export | Modelled |
| --- | --- | --- | --- | --- |
| `Channels.csv` | [channels.md](channels.md) | Yes | Yes | `Channel[]` (`multiMode` / `modeProfiles`) |
| `Zones.csv` | [zones.md](zones.md) | Yes | Yes | `Zone[]` |
| `Talkgroups.csv` | [talkgroups.md](talkgroups.md) | Yes | Yes | `TalkGroup[]` |
| `Contacts.csv` | [contacts.md](contacts.md) | Yes | Yes | `Contact[]` (`signalingMode: dmr`) |
| `RXGroupLists.csv` | [rx-group-lists.md](rx-group-lists.md) | Yes | Yes | `RxGroupList[]` |
| `DTMFContacts.csv` | [dtmf-contacts.md](dtmf-contacts.md) | Yes | Yes | `Contact[]` (`signalingMode: dtmf`) |
| `Scan.csv` | [scan-lists.md](scan-lists.md) | **Skip** | Zone-derived ([#164](https://github.com/pskillen/codeplug-tool/issues/164)) | Zone flags — manual CRUD [#125](https://github.com/pskillen/codeplug-tool/issues/125) |
| `DMR-ID.csv` | — | **Skip** | **Skip** | Accepted gap |

Committed fixture: [`test-data/baofeng-dm32/v1.60/`](../../../test-data/baofeng-dm32/v1.60/).

## Filename quirks

- v1.60 CPS uses **PascalCase** (`Channels.csv`, `Scan.csv`).
- Operator-repo exports may use lowercase (`channels.csv`, `scanlist.csv`).
- Some CPS builds save `channels.csv.csv` — rename to `channels.csv` before import.

## Foreign keys (name-based at wire edge)

| Column | Target file |
| --- | --- |
| Channel `TX Contact` | `Talkgroups.csv` or `Contacts.csv` |
| Channel `RX Group List` | `RXGroupLists.csv` or sentinel `ALL` |
| Channel `Scan List` | `Scan.csv` _(lossy in #67)_ |
| Zone `Channel Members` | `Channels.csv` (pipe-separated) |
| RX group `Contact Members` | `Talkgroups.csv` / `Contacts.csv` |

## Radio profile

Per-radio limits and wire ladders: [`radios/baofeng-dm32uv.md`](radios/baofeng-dm32uv.md).

## Related

- [Adapter behaviour](../../features/import-export/dm32/README.md)
- [Multi-talkgroup expansion](../multi-talkgroup-expansion.md)
