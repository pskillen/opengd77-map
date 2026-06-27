# DM32 CPS CSV import/export — outstanding

**Tracking:** [codeplug-tool#67](https://github.com/pskillen/codeplug-tool/issues/67)

---

## Closed via [#157](https://github.com/pskillen/codeplug-tool/issues/157)

- [x] DM-32 `Forbid TX` / receive-only consolidated on `forbidTransmit`
- [x] Analog squelch radio default exports as `Squelch Level` `1`
- [x] `ChannelTxAdmit` enum with DM-32 wire mapping

---

## Deferred (by design in #67)

- [ ] **Manual scan lists** — [#125](https://github.com/pskillen/codeplug-tool/issues/125): generic `ScanList` entity + import round-trip. **Zone-derived** `Scan.csv` export shipped ([#164](https://github.com/pskillen/codeplug-tool/issues/164)); import still skipped.
- [ ] **`DMR-ID.csv`** and channel `DMR ID` column — accepted lossy gap (export uses profile default label)
- [ ] **CRUD UI for DTMF contacts** — import/export + merge only in v1

---

## Known limitations (not bugs)

- **GB7GL T1/T2 / Hotspot TS*** — promiscuous monitor rows use `RX Group List = ALL`; app preserves 1:1 (no multi-TG collapse). Intentional operator layout, not merged.
- **Per-TG flat channel names** (`GB7GL Scot Chat`, `HS Scot 23550`, …) — stems differ; `mergeImportChannelsMultiTalkgroupBestEffort` does not collapse them. Round-trip is 1:1.
- **Fixture `RXGroupLists.csv`** — normalised CPS wire typos (`Scot. West|UK Calling`, trailing pipes) for multiset compare; see [fixtures.md](../../../build/testing/fixtures.md).
