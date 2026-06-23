# ChannelMergeCandidatesModal

Review and apply post-hoc multi-mode channel merges detected from the active codeplug.

**Entry:** Channels list section nav — **Find merge candidates**.

**Flow:** scan at open → per-group **Merge** (result name editable) → card greys out; modal stays open for further merges or **Close**.

Ambiguous and unsupported multi-talkgroup groups are listed without a merge action.

Mantine modals use `MODAL_ABOVE_MAP_Z_INDEX` from `theme.ts` so they render above Leaflet map controls.
