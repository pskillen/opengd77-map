# Native YAML reference

Authoritative reference for the **Codeplug Tool native YAML** interchange format — lossless serialisation of the internal [codeplug project](../../features/codeplug-project/README.md) (wrapper + nested [codeplug](../../features/data-model/README.md)). Sibling formats at the import/export boundary: OpenGD77, CHIRP, DM32, qDMR.

**Tracking:** [codeplug-tool#10](https://github.com/pskillen/codeplug-tool/issues/10)

## File shape

| Property | Value |
| --- | --- |
| Files per export | **One** `.yaml` or `.yml` |
| Typical filename | `codeplug.yaml` or project name + `.yaml` |
| Encoding | UTF-8 |
| Foreign keys | UUID `id` fields — same as internal model |

Unlike CPS CSV formats, native YAML does **not** use wire columns or radio-specific sentinels. Fields map 1:1 to TypeScript types in [`src/models/codeplug.ts`](../../../src/models/codeplug.ts) and [`src/models/codeplugProject.ts`](../../../src/models/codeplugProject.ts).

## Document envelope

Top-level keys (order not significant on import; export uses stable ordering):

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `format` | string | Yes | Must be `codeplug-tool-native-yaml` |
| `formatVersion` | number | Yes | Document format version; currently `1` |
| `project` | object | Yes | `CodeplugProject` metadata (no nested `codeplug`) |
| `codeplug` | object | Yes | Full `Codeplug` entity tree |

### `project` fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | UUID — preserved on round-trip |
| `name` | string | Display name |
| `description` | string | Short summary |
| `notes` | string | Free-form operator notes |
| `author` | string | Operator annotation only |
| `targetRadios` | string[] | Indicative labels only |
| `createdAt` | string | ISO 8601 |
| `updatedAt` | string | ISO 8601 — refreshed on export |

### `codeplug` fields

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | number | Internal model version; see `CODEPLUG_SCHEMA_VERSION` in code |
| `channels` | `Channel[]` | Full channel objects including `modeProfiles`, `meta`, etc. |
| `zones` | `Zone[]` | `memberChannelIds` by UUID |
| `talkGroups` | `TalkGroup[]` | |
| `rxGroupLists` | `RxGroupList[]` | `memberRefs` as `{ kind, id }` |
| `contacts` | `Contact[]` | |
| `meta` | `CodeplugMeta` | `importedAt`, `sourceFiles`, etc. |

Entity field semantics match [data model](../../features/data-model/README.md). Per-entity `meta.imported` and `meta.repeaterDirectory` are preserved when present.

## `formatVersion` policy

| `formatVersion` | Meaning |
| --- | --- |
| `1` | Initial shipped envelope (`project` + `codeplug`) |

Breaking envelope changes increment `formatVersion`. Importers reject unknown versions with a clear error.

## Import behaviour

1. Parse YAML text.
2. Validate `format` and supported `formatVersion`.
3. Construct `CodeplugProject` from `project` + `codeplug`.
4. Run `migrateCodeplug()` on the nested codeplug if `schemaVersion` is older than current.
5. Hand off to existing import merge / new-project flows.

No wire-name resolution — relationships are already id-based in the file.

## Export behaviour

Serialise the active `CodeplugProject` from the store:

- Set `format` / `formatVersion`.
- Copy project metadata; set `updatedAt` to export time.
- Embed full `codeplug` with current `schemaVersion`.
- Default download name: `codeplug.yaml`.

## Lossless guarantee

Success criterion ([#10](https://github.com/pskillen/codeplug-tool/issues/10)): export from browser A → import in browser B → identical project state (ids, metadata, all entities and FKs).

CPS-specific wire provenance (`meta.imported.*Wire*`) round-trips when present; it is not required for in-app-created entities.

## Classification (import)

| Signal | Result |
| --- | --- |
| Extension `.yaml` or `.yml` and `format: codeplug-tool-native-yaml` | `native-document` (single file) |
| Otherwise | `unknown` |

## Related

- [Adapter behaviour](../../features/import-export/native-yaml/README.md)
- [Data model](../../features/data-model/README.md)
- [Codeplug projects](../../features/codeplug-project/README.md)
