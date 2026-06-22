# CHIRP CSV import / export

Adapter behaviour for **CHIRP** analogue FM/AM CSV — a sibling format to OpenGD77, DM32, and qDMR (unrelated to OpenGD77 DMR). **Column semantics and conversion rules** live in the authoritative [CHIRP reference](../../../reference/chirp/README.md); **per-radio limits** in [radio profiles](../../../reference/chirp/radios/README.md).

Entity shapes: [data model](../../data-model/README.md).

**Tracking:** [codeplug-tool#103](https://github.com/pskillen/codeplug-tool/issues/103) — [progress](chirp-progress.md) · [outstanding](chirp-outstanding.md)

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Wire reference | Shipped | [reference/chirp/](../../../reference/chirp/README.md) |
| Import adapter | In progress | `src/lib/import/chirp/` |
| Export adapter | In progress | `src/lib/export/chirp/` |
| UI format entry | In progress | `vendorFormats.ts` |
| Radio profile picker | In progress | Three fixture profiles |

## Documentation map

| Doc | Contents |
| --- | --- |
| [reference/chirp/README.md](../../../reference/chirp/README.md) | Wire format hub |
| [reference/chirp/channels.md](../../../reference/chirp/channels.md) | Column ↔ internal mapping |
| [reference/chirp/radios/](../../../reference/chirp/radios/README.md) | Per-radio export limits |
| [operator lifecycle](../../workflows/operator-lifecycle.md) | Multi-format export workflow |
| [import-export hub](../README.md) | Generic registry and merge semantics |

## Adapter

| Item | Location |
| --- | --- |
| Import adapter | [`src/lib/import/chirp/adapter.ts`](../../../../src/lib/import/chirp/adapter.ts) |
| Import parsers | [`parse.ts`](../../../../src/lib/import/chirp/parse.ts) |
| Import headers | [`columns.ts`](../../../../src/lib/import/chirp/columns.ts) |
| Export serialisers | [`src/lib/export/chirp/`](../../../../src/lib/export/chirp/) |

## Classification

`detectKind(fileName, headerRow)`:

| Signal | Result |
| --- | --- |
| Headers include `Location`, `Name`, `Frequency`, `Duplex`, `Mode` | `channels` |
| Otherwise | `unknown` |

Typical filename: `{RadioModel}_{YYYYMMDD}.csv` — one file per radio.

## New project naming

| User selection | Default project name |
| --- | --- |
| **Single CSV** (no folder) | `CHIRP YYYY-MM-DD` (ISO date, UTC) |
| **Folder** containing one CHIRP CSV | Leaf directory name |

`projectNameLabel: 'CHIRP'`.

## Parse flow

| File kind | Parser | Model output |
| --- | --- | --- |
| `channels` | `parseChannels` | `Channel[]` only |

Zones, contacts, talk groups, and RX group lists are **not** imported. Existing entities of those types are untouched on merge ([#58](https://github.com/pskillen/codeplug-tool/issues/58)).

## Skip vs error

| Outcome | When |
| --- | --- |
| **Recognised** | CHIRP header fingerprint |
| **Error** | Parse failure on recognised file |
| **Batch rejected** | File not recognised by selected format adapter |

## Export

- **Single CSV download** with profile-specific power ladder and memory cap warnings
- **Analogue channels only** — DMR/digital channels skipped with warning listing names
- **`Location`:** assigned 1…n in channel list order at export — not stored internally

## Lossy fields

| Field | Behaviour |
| --- | --- |
| `Location` | Export-time assignment only |
| DMR columns (`URCALL`, …) | Empty on analogue export |
| Mixed project DMR channels | Skipped on CHIRP export with warning |
| `TStep` ↔ `bandwidthKHz` | Approximate mapping |
| Original import `Location` order | Not preserved if channel list reordered |

## Manual verify

1. Import `sample-exports/Chirp 2026-06-29/Baofeng_UV-5R Mini_20251129.csv` → channels on map/CRUD
2. Export CHIRP CSV → re-import → compare fields
3. Mixed OpenGD77 project → export CHIRP → warnings for DMR channels

## Related

- [Import / export hub](../README.md)
- [Adding a new vendor format](../adding-a-new-vendor.md)
