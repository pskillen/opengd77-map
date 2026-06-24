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
**Commit:** _(pending)_

**Delivered**

- `src/lib/channelExpansion/shortenName.ts` — `shortenWireName`, `finalizeWireName`, `uniqueWireName`, `disambiguationSuffixLength`
- Pipeline: talk-group member suffix → dictionary → vowel-squeeze → `callsign_suffix` downgrade (export-only, `callsign_name` only) → truncate (preserves `-F`/`-D`)
- Re-exported from `src/lib/channelExpansion/index.ts`
- Tests: `src/lib/channelExpansion/shortenName.test.ts`

**Verify**

- `npm run test -- src/lib/channelExpansion/shortenName.test.ts`

---

## Next

- Slice 3 — `TalkGroup.abbreviation` model field + v13 migration
