# OpenGD77 complete import/export — progress

**Tracking:** [codeplug-tool#38](https://github.com/pskillen/codeplug-tool/issues/38)

---

## Overall status

**Status:** Complete (shipped)

---

## Delivered

- Extended `Channel` (hybrid fields + `voxEnabled`, `transmitTimeout`, `scanSkip`, `vendorExtras`)
- Renamed `TgList` → `RxGroupList`; schema v2 with v1 migration
- Import: full Channels.csv, Contacts.csv, TG_Lists.csv; DTMF/APRS skipped
- Export: OpenGD77 serialisers, per-file + ZIP download, `/export` route
- Round-trip test (`src/lib/export/opengd77/roundtrip.test.ts`)
- Docs: opengd77 adapter, data-model, import/export hub (now `import-export/`)

**Verify**

- `npm run lint && npm run test && npm run build`
- `npm run dev` → import sample folder → `/#/export` → download ZIP
- Hard refresh — schema persists from LocalStorage

---

## Next

- See [outstanding.md](../outstanding.md) for open debt (APRS/DTMF modelling, radio profile picker [#72](https://github.com/pskillen/codeplug-tool/issues/72), optional real fixtures).
