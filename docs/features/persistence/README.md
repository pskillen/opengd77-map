# LocalStorage persistence

How codeplug projects are saved and restored in the browser.

**Tracking:** [codeplug-tool#9](https://github.com/pskillen/codeplug-tool/issues/9)

## Problem

Imported codeplug state should survive page reloads without re-importing CSV files. Data stays in the browser only — never in the repository.

## What is persisted

A versioned **projects envelope** at a single LocalStorage key:

```json
{
  "version": 1,
  "activeProjectId": "…",
  "projects": [
    {
      "id": "…",
      "name": "Channels",
      "createdAt": "2026-06-18T…",
      "updatedAt": "2026-06-18T…",
      "codeplug": { "channels": [], "zones": [], "…": "…" }
    }
  ]
}
```

Each `codeplug` object is a full [`Codeplug`](../../src/models/codeplug.ts) (channels, zones, stubs, `meta`).

## Storage keys

| Key | Purpose |
| --- | --- |
| `mm9pdy-codeplug-tool.codeplug` | Projects envelope (`CODEPLUG_STORAGE_KEY`) |
| `mm9pdy-codeplug-tool.channel-map.mapboxToken` | Mapbox token — separate, map-only |
| `mm9pdy-codeplug-tool.channel-map.tileProvider` | Tile provider preference — separate |

## Versioning

| Constant | Value | Gates |
| --- | --- | --- |
| `CODEPLUG_STORAGE_VERSION` | `1` | On-disk envelope shape |
| `CODEPLUG_SCHEMA_VERSION` | `3` | Inner `Codeplug` model shape (`meta.schemaVersion`); v1/v2 codeplugs migrate on load |

Unknown or future envelope `version` → boot with an empty project set (no crash).

## Load / save / clear

| Action | LocalStorage |
| --- | --- |
| Import on home (new project) | Save envelope |
| Import on map (active project) | Save |
| Switch active project | Save |
| Delete project | Save (or remove key if last project) |
| Clear all (map) | Save (active project codeplug emptied; project kept) |
| Empty project set | Key removed |
| Corrupt JSON on load | Key removed; boot empty |
| Partially invalid projects | Invalid entries filtered; `activeProjectId` fixed up |

**Code:** [`src/state/codeplugStorage.ts`](../../src/state/codeplugStorage.ts), wired from [`src/state/codeplugStore.tsx`](../../src/state/codeplugStore.tsx).

## Quota handling

`saveProjectsToStorage` throws `StorageQuotaError` when `setItem` hits `QuotaExceededError`. The store surfaces a dismissible yellow **Alert** in import UI; in-memory state is not blocked — the user can keep working but may lose data on reload.

## Size limits

- Typical browser limit: **~5 MB per origin** (varies by browser and other keys on the same origin).
- A medium OpenGD77 export (hundreds of channels, dozens of zones) is usually well under 1 MB as JSON.
- Multiple projects share the same quota. Very large codeplugs or many projects may need [#32](https://github.com/pskillen/codeplug-tool/issues/32) (IndexedDB / OPFS).

## Privacy

- All project data is browser-local only.
- Never commit operator CSV exports or LocalStorage dumps to the repo.
- Use `sample-exports/` (gitignored) for local testing.

## Manual verify

1. `npm run dev` → import a codeplug on the home page → open the map.
2. Hard refresh (Cmd+R) — projects and active selection restored.
3. Import a second codeplug from home — both listed after refresh.
4. Delete a project — confirm dialog; refresh — deletion persists.
5. DevTools → Application → Local Storage — confirm `mm9pdy-codeplug-tool.codeplug` envelope.

## Related

- [Codeplug projects](../codeplug-project/) — wrapper model and CRUD
- [Data model](../data-model/) — `Codeplug` contents
- [Import / export](../import-export/) — CSV → codeplug at the store boundary
