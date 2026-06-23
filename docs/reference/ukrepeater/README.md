# ukrepeater.net / RSGB ETCC API reference

Authoritative reference for the **RSGB ETCC beta API** (`https://api-beta.rsgb.online`) used by the ukrepeater.net repeater directory import in codeplug-tool.

**Tracking:** [codeplug-tool#92](https://github.com/pskillen/codeplug-tool/issues/92)

This is a **remote directory API**, not a CPS wire format. Mapping to the internal [codeplug model](../../features/data-model/README.md) lives in [`src/lib/repeaterDirectories/ukrepeater/`](../../../src/lib/repeaterDirectories/ukrepeater/). Feature behaviour: [repeater-directories](../../features/repeater-directories/README.md).

## API

| Property | Value |
| --- | --- |
| Base URL | `https://api-beta.rsgb.online` |
| Response shape | `{ "data": [ …listing… ] }` |
| CORS | `Access-Control-Allow-Origin: *` — callable from the browser SPA |
| Stability | **Beta** — degrade gracefully on failure; cache responses; attribute source in UI |

### Endpoints

| Endpoint | Example | Returns |
| --- | --- | --- |
| `/callsign/{call}` | `/callsign/gb7dc` | Listings for repeater callsign |
| `/locator/{4-or-6}` | `/locator/io92`, `/locator/io92pp` | Listings in locator square |
| `/band/{band}` | `/band/2m`, `/band/70cm` | Listings on band (large payload) |
| `/keeper/{call}` | `/keeper/g7npw` | Listings for keeper callsign |
| `/all/systems` | — | All public listings |

There is **no town/QTH endpoint**. Town search geocodes to a 4-character locator, then calls `/locator/`.

## Listing record (sample)

```json
{
  "id": 4763,
  "type": "DM",
  "status": "OPERATIONAL",
  "keeperCallsign": "G7NPW",
  "town": "DERBY",
  "modeCodes": ["A", "D", "M:1", "F", "P", "N"],
  "tx": 439350000,
  "rx": 430350000,
  "repeater": "GB7DC",
  "ctcss": 71.9,
  "txbw": 12.5,
  "band": "70CM",
  "locator": "IO92",
  "dbwErp": 14,
  "extraDetails": { "ngr": "SK3837", "antennaHeight": 0, "polarisation": "" }
}
```

## Frequency inversion (critical)

Repeater-side frequencies are **inverted** vs the radio channel:

| ETCC field | Internal `Channel` |
| --- | --- |
| `tx` (repeater output) | `rxFrequency` |
| `rx` (repeater input) | `txFrequency` |

Values are integer **Hz**.

## Mode flags (`modeCodes`)

| Flag | Meaning | Phase 1 mapper |
| --- | --- | --- |
| `A` | Analogue FM | → `fm` |
| `M` or `M:n` | DMR, colour code *n* | → `dmr`, `colourCode = n` |
| `D` | D-STAR | Not mapped in phase 1 |
| `F` | Fusion | Not mapped in phase 1 |
| `P` | P25 | Not mapped in phase 1 |
| `N` | NXDN | Not mapped in phase 1 |
| `X` | Node / packet | Not mapped in phase 1 |

When both `A` and `M`/`M:n` appear, the mapper creates a **`multiMode`** channel with `fm` + `dmr` profiles.

Timeslot is **not** in ETCC listings — operator fills in CRUD.

## Field mapping (ETCC → internal `Channel`)

| ETCC field | Internal field | Notes |
| --- | --- | --- |
| `tx` | `rxFrequency` | Hz; see inversion above |
| `rx` | `txFrequency` | Hz |
| `ctcss` | `rxTone`, `txTone` | `0` → `'none'`; else Hz string |
| `txbw` | `bandwidthKHz` | kHz |
| `modeCodes` | `mode`, `colourCode`, `multiMode`, `modeProfiles` | See mode flags |
| `locator` | `location` | Via `locatorToCoords`; `useLocation: true` when resolved |
| `repeater` | `callsign` | |
| `town` | `name` | Human qualifier; `exportNameMode` defaults to `callsign_name` |
| `town`, `status`, `keeperCallsign`, `extraDetails.ngr`, `dbwErp` | `meta.repeaterDirectory.snapshot` | Display / verify only |
| `id` | `meta.repeaterDirectory.remoteListingId` | Verify identity |

## Lossy / not modelled

| ETCC data | Treatment |
| --- | --- |
| Talk groups, contacts, RX group lists | Operator configures in CRUD |
| DMR timeslot | Operator configures in CRUD |
| Non-FM/DMR-only listings | Skipped with reason in search UI |
| `type`, `fac`, antenna height, polarisation | Snapshot metadata only |

## Disclaimer

Frequency and site data from ukrepeater.net is for amateur programming convenience. Not authoritative for emergency operations.

## Related

- [repeater-directories feature docs](../../features/repeater-directories/README.md)
- [data model — Channel](../../features/data-model/README.md)
- [ETCC API docs](https://api-beta.rsgb.online/)
