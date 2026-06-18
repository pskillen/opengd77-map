# OpenGD77 complete import/export — progress

**Tracking:** [codeplug-tool#38](https://github.com/pskillen/codeplug-tool/issues/38)
**Branch:** `38/paddy/opengd77-full-import-export`

---

## Overall status

**Status:** Complete (pending merge)

---

## Delivered

- Extended `Channel` (hybrid fields + `voxEnabled`, `transmitTimeout`, `scanSkip`, `vendorExtras`)
- Renamed `TgList` → `RxGroupList`; schema v2 with v1 migration
- Import: full Channels.csv, Contacts.csv, TG_Lists.csv; DTMF/APRS skipped
- Export: OpenGD77 serialisers, per-file + ZIP download, `/export` route
- Round-trip test (`src/lib/export/opengd77/roundtrip.test.ts`)
- Docs: opengd77, data-model, import/export hubs

**Verify**

- `npm run lint && npm run test && npm run build`
- `npm run dev` → import sample folder → `/#/export` → download ZIP
- Hard refresh — v2 schema persists

---

## Next

- Merge PR; publish release for GitHub Pages deploy
