# System tests

**Purpose:** Multi-step workflows **after** the import adapter boundary — store apply, merge/overwrite, CRUD between imports, persistence, multi-project isolation. Raw parser rows belong in [unit.md](unit.md); browser UI belongs in [component.md](component.md) and [e2e.md](e2e.md).

## Command

```bash
npm run test:system
```

Runs `src/test/system/` and `ImportIntoActivePanel` component workflow tests (import UI shares the same production chain).

## Workflow harness

Single entry point for production call order — reuse in new scenarios and future Playwright helpers:

| Symbol | File | Role |
| --- | --- | --- |
| `runActiveImportWorkflow` | [`importWorkflow.ts`](../../../src/test/system/importWorkflow.ts) | parse → preview → apply → optional persist |
| `runNewProjectImportWorkflow` | same | Home path: new project from import |
| `runStoreActiveImport` | same | Apply via `projectsReducer` for store fidelity |
| `channelIds` | same | Stable id snapshot helper |

Steps (default all except persist):

1. `importFiles` — real adapter
2. `previewImportMerge` — dry-run stats
3. `applyImportToCodeplug` or store `APPLY_IMPORT`
4. Optional: `serializeProjects` → `localStorage` → `loadProjectsFromStorage`

**Invariant assertions** (reuse across scenarios):

- Preview stats === apply report stats
- After apply, preview on resulting codeplug shows idempotent state (re-import unchanged CSV → all `unchanged`)
- Zone `memberChannelIds` resolve from `sourceMemberNames`
- Merge re-import: `channelIds` stable when CSV unchanged

## Scenario matrix

Each scenario is a named `describe` in [`activeImport.system.test.ts`](../../../src/test/system/activeImport.system.test.ts):

| Scenario | Asserts |
| --- | --- |
| **Incremental build** | channels → zones → contacts → TG lists; FK resolution per step |
| **Idempotent re-import** | Full bundle twice; second pass all `unchanged`, ids stable |
| **Delta update** | One cell change → `updated: 1`, rest unchanged |
| **Partial file import** | zones-only leaves channels untouched |
| **Overwrite channels** | Smaller Channels.csv removes extras |
| **Overwrite zones only** | Channels/contacts unchanged |
| **Multi-project isolation** | Apply to active only |
| **Persistence round-trip** | apply → save → reload matches |
| **Preview = apply** | Every scenario above |
| **Unresolved members** | Zone references missing channel → `unresolvedZoneMembers` |
| **hideFromMap preserved** | App flag survives merge field update |

Fixtures: [fixtures.md](fixtures.md) — `minimalBundle`, `modifiedChannelBundle`, etc.

| Suite | File | Asserts |
| --- | --- | --- |
| **OpenGD77 file-level round-trip** | [`opengd77RoundTrip.system.test.ts`](../../../src/test/system/opengd77RoundTrip.system.test.ts) | Full CPS folder import → export; multiset CSV diff per file |
| **CHIRP file-level round-trip** | [`chirpRoundTrip.system.test.ts`](../../../src/test/system/chirpRoundTrip.system.test.ts) | Single CSV import → export; `Location` excluded |

## Manual manipulation path

Prove CRUD between import and export preserves export fidelity:

1. Import fixture bundle (merge or new project).
2. Mutate codeplug via [`codeplugMutations.ts`](../../../src/lib/codeplugMutations.ts) or store actions (edit channel, add zone member).
3. Serialise with export adapter.
4. Assert changed fields appear in output; unchanged entities stable.

Add system scenarios when CRUD affects export-visible fields. Full browser edit flows may additionally get e2e coverage [#40](https://github.com/pskillen/codeplug-tool/issues/40).

## What system must not re-test

| Already covered elsewhere | Layer |
| --- | --- |
| Single-row parse edge cases | Unit (`parse.test.ts`) |
| Column header detection | Unit (`index.test.ts`) |
| Modal button labels | Component RTL |
| File picker / ZIP download | E2e |

## Related

- [Format fidelity](format-fidelity.md) — merge/idempotency scenarios
- [Import / export feature](../../features/import-export/README.md) — active import UI
- [Fixtures](fixtures.md)
