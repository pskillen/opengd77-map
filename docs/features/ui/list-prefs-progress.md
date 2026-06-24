# UI list prefs — progress

**Tracking:** [codeplug-tool#146](https://github.com/pskillen/codeplug-tool/issues/146)

## Status

| Slice | Status | Notes |
| --- | --- | --- |
| Shared list-prefs storage | Complete | `src/lib/listPrefs/` |
| Query hook hydration | Complete | `useChannelListQuery`, `useListNameQuery` |
| Column sort persistence | Complete | All entity list routes |
| Per-project column visibility | Complete | Channel optional columns |
| Registry + docs | Complete | Debug viewer, UI README, persistence README |

## Shipped

- Per-project `localStorage` keys under `mm9pdy-codeplug-tool.list.<entity>.<projectId>`
- URL hydrate-on-empty + write-through in query hooks
- Column sort hooks for channels and simple entity lists
- Legacy `channels-list-columns` migration to per-project keys
- Debug localStorage viewer labels for list-pref keys

## Manual verify

See issue #146 manual verify checklist.
