# DM32 — Talkgroups.csv

| Column | Internal | Notes |
| --- | --- | --- |
| `No.` | _(export only)_ | Sequential on export |
| `Name` | `TalkGroup.name` | FK target for digital TX / RX list members |
| `ID` | `TalkGroup.number` | DMR talk-group ID string |
| `Type` | `TalkGroup.callType` | `Group Call` → `group`; `Private Call` → `private` |

Private-call rows in this file (e.g. `Parrot 9990`) round-trip here — they are not moved to `Contacts.csv`.
