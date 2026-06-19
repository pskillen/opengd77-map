# Codeplug projects

Contributor reference for the **codeplug project** wrapper — the named, persistent, switchable container that holds one codeplug and is the unit users work with across tools.

**Tracking:** [codeplug-tool#9](https://github.com/pskillen/codeplug-tool/issues/9) (persistence + nascent CRUD), [codeplug-tool#31](https://github.com/pskillen/codeplug-tool/issues/31) (UI polish), [codeplug-tool#76](https://github.com/pskillen/codeplug-tool/issues/76) (nav + route guards)

## Problem

Operators often maintain several CPS layouts side by side — e.g. home repeaters, contest weekend, travel — and need to switch between them without re-importing each time. The **codeplug** (channels, zones, contacts, etc.) is the radio configuration *content*; the **codeplug project** is the app-level wrapper that gives that content a name, identity, and persistence boundary.

## Terminology (locked)

| Term | Meaning | In code | In docs | Shown to user |
| --- | --- | --- | --- | --- |
| **Codeplug** | Radio configuration *content* | `Codeplug` — [`src/models/codeplug.ts`](../../../src/models/codeplug.ts) | [data-model/](../data-model/) | "codeplug" |
| **Codeplug project** | Named container holding one codeplug + identity | `CodeplugProject` — [`src/models/codeplugProject.ts`](../../../src/models/codeplugProject.ts) | this folder | usually "codeplug" |
| **Active project** | Currently selected project; tools read/write its codeplug | `activeProjectId` | [persistence/](../persistence/) | n/a |

User-facing copy avoids the `-project` suffix where possible ("Import codeplug", "Switch codeplug"). Use "project" only when the switching action needs disambiguation.

## Data model

```ts
interface CodeplugProject {
  id: string;
  name: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  codeplug: Codeplug;
}
```

`newProject(name, codeplug?)` creates a project; `defaultProjectName(recognisedFiles)` derives a name from import filenames (fallback: `"Imported codeplug"`).

Identity lives on the wrapper so [`Codeplug`](../data-model/README.md) stays focused on CPS contents.

## Store

[`src/state/codeplugStore.tsx`](../../../src/state/codeplugStore.tsx) backs `CodeplugProvider`:

| Hook | Role |
| --- | --- |
| `useCodeplug()` | Active project's `codeplug`, `applyImport`, `clear`, persistence warnings |
| `useProjects()` | Full list, active id, `importNewProject`, `setActiveProject`, `deleteProject` |

| Action | Effect |
| --- | --- |
| `importNewProject` | New project from import; becomes active |
| `applyImport` / `applyImportToActive` | Merge into active project (or create if none) |
| `setActiveProject` | Switch active |
| `deleteProject` | Remove; reassign active |
| `clear` | Empty active project's codeplug (project kept) |

Persistence: [persistence/README.md](../persistence/README.md) — multi-project envelope from storage v1.

## UI (nascent)

| Surface | Behaviour |
| --- | --- |
| Home (`/`) | List codeplugs, **Import codeplug**, **Open**, **Delete** (confirm) |
| App nav (always) | **Home** (when no active project), **Reference**, **Settings** |
| App nav (when active) | **Active codeplug** + **Switch**; Summary, Channels, Zones, contacts/TG lists, Export; Reference and Settings at the foot |
| Route guards | Project-scoped routes redirect to Home when no active project — [`RequireActiveProject`](../../../src/components/RequireActiveProject/RequireActiveProject.tsx) |

No **new empty project** yet — import is the only creation path ([#31](https://github.com/pskillen/codeplug-tool/issues/31)).

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| `CodeplugProject` model | Shipped | `src/models/codeplugProject.ts` |
| Multi-project store | Shipped | `useCodeplug` + `useProjects` |
| LocalStorage persistence | Shipped | [persistence/](../persistence/) |
| Landing list / import / delete | Shipped | `Home`, `ProjectList` |
| Active bar + project nav | Shipped | `ActiveProjectBar` + project links when a codeplug is active |
| Always-available nav | Shipped | Home, Reference, Settings — [#76](https://github.com/pskillen/codeplug-tool/issues/76) |
| Project route guards | Shipped | `RequireActiveProject` — [#76](https://github.com/pskillen/codeplug-tool/issues/76) |
| New empty project | Deferred | [#31](https://github.com/pskillen/codeplug-tool/issues/31) |
| Rename / duplicate | Deferred | [#31](https://github.com/pskillen/codeplug-tool/issues/31) |
| Refined switcher / import-export UI | Deferred | [#31](https://github.com/pskillen/codeplug-tool/issues/31) |

## Documentation map

| Doc | Contents |
| --- | --- |
| [codeplug-project-progress.md](codeplug-project-progress.md) | Execution log |
| [codeplug-project-outstanding.md](codeplug-project-outstanding.md) | #31 UI debt |
| [persistence/README.md](../persistence/README.md) | LocalStorage envelope |
| [data-model/README.md](../data-model/README.md) | `Codeplug` contents |

## Privacy

Projects are browser-local only. Never commit operator codeplugs or LocalStorage dumps.

## Related

- [Persistence](../persistence/)
- [Import](../import/)
- [Map](../map/)
