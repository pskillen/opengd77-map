# Export name shortening — progress

**Tracking:** [codeplug-tool#130](https://github.com/pskillen/codeplug-tool/issues/130) · stop-gap for [#122](https://github.com/pskillen/codeplug-tool/issues/122)
**Plan:** `.cursor/plans/shorten_export_channel_names_2db5231f.plan.md`
**Branch:** `130/paddy/shorten-export-names`

---

## Overall status

**Status:** In progress

---

## Slice 1 — Abbreviation dictionary

**Status:** Complete (committed)
**Commit:** `799dd78` — `feat(channel-expansion): add progressive abbreviation dictionary`

**Delivered**

- Authoring source: `data/dictionaries/abbreviations.yaml`
- Codegen: `scripts/generate-abbreviations.mjs` → `src/lib/channelExpansion/dictionary.generated.ts` (gitignored `*.generated.ts`; runs on `predev` / `prebuild` / `pretest`)
- Wrapper: `src/lib/channelExpansion/abbreviations.ts` — `abbreviateWord`, `isStopword`, `matchWordCasing`
- Tests: `src/lib/channelExpansion/abbreviations.test.ts`

**Verify**

- `npm run generate:abbreviations && npm run test -- src/lib/channelExpansion/abbreviations.test.ts`

---

## Slice 2 — Core shortening helper

**Status:** Complete (committed)
**Commit:** `49a14db` — `feat: add pure channel-name shortening helper`

**Delivered**

- `src/lib/channelExpansion/shortenName.ts` — `shortenWireName`, `finalizeWireName`, `uniqueWireName`, `disambiguationSuffixLength`
- Pipeline: talk-group member suffix → dictionary → vowel-squeeze → `callsign_suffix` downgrade (export-only, `callsign_name` only) → truncate (preserves `-F`/`-D`)
- Re-exported from `src/lib/channelExpansion/index.ts`
- Tests: `src/lib/channelExpansion/shortenName.test.ts`

**Verify**

- `npm run test -- src/lib/channelExpansion/shortenName.test.ts`

---

## Slice 3 — TalkGroup.abbreviation

### Slice 3a — Model + migration

**Status:** Complete (committed)
**Commit:** `b5d4c80` — `feat: add TalkGroup.abbreviation model field + v13 migration`

**Delivered**

- `TalkGroup.abbreviation?: string` on internal model
- `CODEPLUG_SCHEMA_VERSION` 12 → 13; `migrateTalkGroup` carries optional abbreviation
- v12 fixture tests in `codeplugStorage.test.ts`
- Persistence and data-model docs updated

### Slice 3b — CRUD UI

**Status:** Complete (committed)
**Commit:** `72c0b57` — `feat: edit/show talk group abbreviation in CRUD`

**Delivered**

- Optional abbreviation field on `TalkGroupEdit` (optional-spread on save)
- Abbreviation shown on `TalkGroupDetail`
- `buildTalkGroup` accepts `abbreviation` via `Partial<TalkGroup>` overrides

---

## Next

- Slice 4 — Wire shortening into the expansion path
