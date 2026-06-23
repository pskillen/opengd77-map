# DM32 CPS CSV import/export — outstanding

Items **skipped**, **incomplete**, or **discovered during execution** — not future plan phases.

**Tracking:** [codeplug-tool#67](https://github.com/pskillen/codeplug-tool/issues/67)

---

## Deferred (by design in #67)

- [ ] **Scan lists** — [#125](https://github.com/pskillen/codeplug-tool/issues/125): generic `ScanList` entity + `Scan.csv` + channel `Scan List` column
- [ ] **`DMR-ID.csv`** and channel `DMR ID` column — accepted lossy gap
- [ ] **CRUD UI for DTMF contacts** — import/export + merge only in v1

---

## Checklist gaps (from plan kickoff)

- Adapter interfaces exist (`src/lib/import-export/`) — reuse for DM32
- `expandModes` flag not yet on channelExpansion — Slice 2.5
- `Contact.identifier` / `signalingMode` not yet on model — Slice 0.b
