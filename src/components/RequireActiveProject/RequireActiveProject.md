# RequireActiveProject

## Purpose

React Router layout route that gates project-scoped pages behind an active codeplug project. Redirects to Home when `activeProjectId` is null.

## Behaviour

- Reads `activeProjectId` from `useProjects()`.
- If no active project: `<Navigate to="/" replace />`.
- Otherwise: renders child routes via `<Outlet />`.

Used in [`App.tsx`](../../App.tsx) to wrap Summary, Channels, Zones, contacts/TG lists, Export, and the `/map` redirect.

## Related

- [codeplug-project docs](../../../../docs/features/codeplug-project/README.md) — nav and route guard behaviour
- [codeplug-tool#76](https://github.com/pskillen/codeplug-tool/issues/76)
