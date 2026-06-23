# Channel naming — progress

**Tracking:** [codeplug-tool#54](https://github.com/pskillen/codeplug-tool/issues/54)  
**Branch:** `54/paddy/first-class-callsign-naming`

---

## Overall status

**Status:** Complete — PR pending

---

## Slice 0 — Parsing documentation

**Status:** Done (`d513156`)

- [channel-name-parsing.md](../import-export/channel-name-parsing.md)
- [callsigns.md](../../reference/callsigns.md)
- Import-export README documentation map row

---

## Slice 1 — Model + naming library

**Status:** Done (`862bbb2`)

- `ChannelExportNameMode`, schema v12, `channelNaming.ts`, v11→v12 migration

---

## Slice 2 — Mutations + validation

**Status:** Done (`aeb302a`)

- Wire-name merge keys, validation, `buildNameToChannelId`

---

## Slice 3 — Import parsers

**Status:** Done (`f6ff408`)

- OpenGD77 / DM32 / CHIRP stamp `channelWireName`; post-collapse normalise; ukrepeater mapper

---

## Slice 4 — Export composition

**Status:** Done (`7ae0bb7`)

- `expandChannelForExport` uses `composeChannelWireName`; CHIRP comment not exported

---

## Slice 5 — CRUD + map UI

**Status:** Done (`24349ff`)

- Edit/detail forms, list callsign column, map label toggle

---

## Slice 6 — Documentation

**Status:** Done

- Tier 1/2/3 cross-links, progress/outstanding, data-model + persistence schema notes

---

## Next

- Merge [#137](https://github.com/pskillen/codeplug-tool/pull/137) to close #54
- Phase-2 patterns: [#136](https://github.com/pskillen/codeplug-tool/issues/136)
