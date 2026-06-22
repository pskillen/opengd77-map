# Codeplug projects — progress

**Branch:** `102/paddy/start-fresh-blank-codeplug`  
**Tracking:** [#102](https://github.com/pskillen/codeplug-tool/issues/102), [#60](https://github.com/pskillen/codeplug-tool/issues/60), [#61](https://github.com/pskillen/codeplug-tool/issues/61), [#31](https://github.com/pskillen/codeplug-tool/issues/31) (partial)

## Shipped (#102)

- [x] Slice 1: `ProjectMetadataForm` + `commitNewProject` store action (persist on Create only)
- [x] Slice 2: `/codeplug/new` route + `NewCodeplug` page
- [x] Slice 3: Home **Start fresh** button + format-agnostic copy
- [x] Slice 4: Feature docs + tests

## Shipped (#60 + #61)

- [x] Slice 1: `CodeplugProject` metadata fields (`description`, `notes`, `author`, `targetRadios`) + storage normalization
- [x] Slice 2: `updateProject` store action + project validation
- [x] Slice 3: `/summary/edit` route + `TargetRadiosEditor`
- [x] Slice 4: Summary dashboard with map + compact entity cards
- [x] Slice 5: Home project list shows description when set
- [x] Slice 6: Feature docs + tests

## Shipped (prior)

- [x] Terminology locked — [README](README.md)
- [x] `CodeplugProject` model + `newProject` / `defaultProjectName`
- [x] Multi-project store (`useProjects`, active context via `useCodeplug`)
- [x] Home: project list, import → new project, delete with confirm
- [x] Active-project bar, switch to home
- [x] Shared `ImportDropzone` for home + map

## Verify

- Home → **Start fresh** → **Cancel** → no localStorage write
- Home → **Start fresh** → **Create** → Summary (0 entities); hard refresh persists
- **Edit project** on Summary unchanged
- Import path unchanged
