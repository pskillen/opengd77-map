# Provenance boundary fix — outstanding

**Branch:** `142/pskillen/provenance-boundary-fix`

## Deferred

### CRUD provenance wire-name sync (slice 6)

Not required for reload fix (v7+ no longer re-resolves from provenance). Would improve re-import merge delta accuracy:

- `updateChannel`: refresh `meta.imported.contactWireName` / `rxGroupListWireName` when operator edits refs
- `setRxGroupListMembers` / `syncRglMemberWireNames`: encode TG timeslots via `composeTalkGroupTimeslotWireName` in provenance wire names

## Open

- (none)
