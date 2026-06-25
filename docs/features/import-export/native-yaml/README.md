# Native YAML import / export

Adapter behaviour for the Codeplug Tool **native YAML** interchange format ([#10](https://github.com/pskillen/codeplug-tool/issues/10)).

Wire/schema reference: [docs/reference/native-yaml/](../../../reference/native-yaml/README.md).

## Role

Native YAML is the **lossless** interchange format for the full internal model. Vendor CPS exports (OpenGD77, CHIRP, DM32, …) remain lossy at the boundary; native YAML is for:

- Moving a project between browsers or machines
- Archiving a project outside LocalStorage
- Future cloud sync ([#17](https://github.com/pskillen/codeplug-tool/issues/17))

It is **not** a replacement for CPS export to flash a radio.

## Distinction from qDMR YAML

| | Native YAML | qDMR YAML ([#37](https://github.com/pskillen/codeplug-tool/issues/37)) |
| --- | --- | --- |
| Schema | Codeplug Tool envelope | qDMR vendor schema |
| Model coverage | Full `CodeplugProject` + `Codeplug` | qDMR-specific |
| Status | Shipped with #10 | Planned |

## Code layout

```
src/lib/nativeYaml/
  serde.ts           # parseNativeYaml, serialiseNativeYaml
  serde.test.ts

src/lib/import/native-yaml/
  adapter.ts         # ImportAdapter, interchange: native-document

src/lib/export/native-yaml/
  adapter.ts         # SingleFileExportAdapter
  download.ts
```

Registry: [`src/lib/import-export/registry.ts`](../../../../src/lib/import-export/registry.ts).

## Import adapter

| Property | Value |
| --- | --- |
| `id` | `native-yaml` |
| `delivery` | `single-file` |
| `interchange` | `native-document` |
| `entityKinds` | all (via `parseDocument`) |

`importFiles()` detects native documents before the CSV loop. One YAML file produces a full `ImportResult` plus project metadata for `importNewProject`.

## Export adapter

| Property | Value |
| --- | --- |
| `delivery` | `single-file` |
| `defaultFileName` | `codeplug.yaml` |

Serialises active project from store via `serialiseNativeYaml`.

## Round-trip tests

- Unit: `src/lib/nativeYaml/serde.test.ts`
- System: `src/test/system/nativeYamlRoundTrip.system.test.ts`

## Related

- [Import/export hub](../README.md)
- [Operator lifecycle](../../workflows/operator-lifecycle.md)
- [Cloud storage](../../cloud-storage/README.md)
