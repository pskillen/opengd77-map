# Provenance boundary fix — progress

**Tracking:** [#142](https://github.com/pskillen/codeplug-tool/issues/142) follow-up  
**Branch:** `142/pskillen/provenance-boundary-fix`  
**Status:** Ready for PR

## Goal

`meta.imported` wire strings are merge/delta metadata for re-import — not a shadow model. After import or one-time legacy migration, persisted model FK fields are authoritative on reload and export.

## Shipped

| Slice | Commit | Notes |
| --- | --- | --- |
| 0 Kickoff | `519d68f` | Progress/outstanding logs |
| 1 Docs | `9b63460` | Fidelity contract, persistence, data-model, entityProvenance |
| 2 migrateCodeplug gate | `f7e4d5e` | Wire→id resolution only for schema ≤ 6 |
| 3 Tests | `aee4482` | Channel/RGL reload + import resolve tests |
| 4 Export stash | `281721d` | `profileOpenGd77Extras` from profile not provenance |
| 5 UI counts | `c3893ed` | `rxGroupListMemberCount` from `memberRefs` |
| 6 CRUD sync | — | Deferred (see outstanding) |

## Verify

- `npm run format:check && npm run lint && npm run test && npm run build`
- Manual: edit channel contact on imported channel → hard refresh → contact persists

## Next

Open PR referencing #142.
