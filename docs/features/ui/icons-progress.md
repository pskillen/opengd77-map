# Icon library — progress

**Tracking:** [codeplug-tool#64](https://github.com/pskillen/codeplug-tool/issues/64)
**Plan:** `.cursor/plans/icon_library_rollout_f91bef48.plan.md`

---

## Overall status

**Status:** Complete (pending merge)

**Branch:** `64/paddy/icon-library`

---

## Slice 0: Issue and branch

**Status:** Complete

**Delivered**

- GitHub issue #64
- Branch `64/paddy/icon-library` from `origin/main`
- Progress/outstanding pair and UI feature hub stub

---

## Slice 1: Foundation

**Status:** Complete

**Delivered**

- `@tabler/icons-react` dependency
- `src/lib/iconSizes.ts` shared constants
- Icons section in `docs/reference/display-conventions.md`

---

## Slice 2: Shell navigation

**Status:** Complete

**Delivered**

- `App.tsx` navbar icons
- Reference index sub-nav icons
- ActiveProjectBar Switch icon

---

## Slice 3: CRUD and back navigation

**Status:** Complete

**Delivered**

- List New buttons, detail Edit/Delete/Back, edit Save/Cancel/Back
- ConfirmDeleteModal, ZoneMemberPicker arrow icons
- ReportPage.md back-link note updated

---

## Slice 4: Import, export, and project workflows

**Status:** Complete

**Delivered**

- ImportDropzone upload/file/folder icons
- Export download and ZIP icons
- SummaryCard entity icons and View all arrow
- ProjectList Open/Delete icons

---

## Slice 5: Map and location

**Status:** Complete

**Delivered**

- MapControls `IconSettings` (replaces Unicode cog)
- UseMyLocationButton `IconCurrentLocation`

---

## Verify

- `npm run lint && npm run test && npm run build`
- Nav icons at 260px width; icon-only ActionIcon keeps `aria-label`
- Primary flows: Home → Summary → Channels detail/edit; Export; map settings

---

## Next

- Merge PR; close #64
