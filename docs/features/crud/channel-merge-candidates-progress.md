# Channel merge candidates — progress

**Tracking:** [codeplug-tool#116](https://github.com/pskillen/codeplug-tool/issues/116)  
**Plan:** `.cursor/plans/channel_merge_candidates_2ce56249.plan.md`

---

## Overall status

**Status:** In progress

**Branch:** `116/pskillen/channel-merge-candidates`

---

## Slice 1: Docs kickoff

**Status:** Complete

**Delivered**

- Progress and outstanding files under `docs/features/crud/`
- CRUD README implementation table row

---

## Slice 2: Refactor merge primitives

**Status:** Complete

**Delivered**

- `mergeChannelsToMultiMode`, `channelsAreMultiModeMergeCandidates`, fuzzy name helpers
- `ChannelModeProfile.opengd77Extras` for CRUD merge path

---

## Slice 3: Detection + preview lib

**Status:** Complete

**Delivered**

- `src/lib/channelMergeCandidates.ts` — find, preview, apply
- Unit tests with GB7GL-style fixtures

---

## Slice 4: Mutations + store

**Status:** Complete

**Delivered**

- `mergeChannelsIntoOne` with zone id rewire and `refreshAllZoneSourceNames`
- `APPLY_CHANNEL_MERGES` store action + `useCodeplug().applyChannelMerges`

---

## Slice 5: Review UI

**Status:** In progress

---

## Slice 6: Final docs + PR

**Status:** Not started

---

## Next

- Slice 2: shared `mergeChannelsToMultiMode` in `channelExpansion`
