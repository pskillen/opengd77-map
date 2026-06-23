# ChannelMergeCandidatesModal

Review and apply post-hoc multi-mode channel merges detected from the active codeplug.

**Entry:** Channels list section nav — **Find merge candidates**.

**Flow:** scan at open (settings adjustable) → per-group **Merge** → card greys out; modal stays open.

**Settings (ephemeral):** name similarity slider (strict ↔ loose, no numeric scale), match RX/TX frequency toggles.

Ambiguous and unsupported multi-talkgroup groups are listed without a merge action.

Mantine modals use `MODAL_ABOVE_MAP_Z_INDEX` from `theme.ts` so they render above Leaflet map controls.
