# CHIRP — channel CSV

Wire column reference for the single CHIRP memory CSV. Per-radio memory and power limits: [radios/](radios/README.md).

**Code:** [`columns.ts`](../../../src/lib/import/chirp/columns.ts) · [`parse.ts`](../../../src/lib/import/chirp/parse.ts) · [`channelWire.ts`](../../../src/lib/import/chirp/channelWire.ts) (import) · [`channelWire.ts`](../../../src/lib/export/chirp/channelWire.ts) (export)

## Required headers (app import)

| Header | Reason |
| --- | --- |
| `Location` | CHIRP fingerprint; not stored internally |
| `Name` | Channel identity |
| `Frequency` | RX frequency |
| `Duplex` | Split/simplex semantics |
| `Mode` | Analogue mode wire |

Full standard header row (21 columns): `Location`, `Name`, `Frequency`, `Duplex`, `Offset`, `Tone`, `rToneFreq`, `cToneFreq`, `DtcsCode`, `DtcsPolarity`, `RxDtcsCode`, `CrossMode`, `Mode`, `TStep`, `Skip`, `Power`, `Comment`, `URCALL`, `RPT1CALL`, `RPT2CALL`, `DVCODE`.

Parse by **header name**, not column index.

## Column reference

| CHIRP header | Internal field | Import rule | Export rule | Round-trip | Notes |
| --- | --- | --- | --- | --- | --- |
| `Location` | _(export only)_ | **Ignored** | 1-based index in channel list order | Not preserved | Memory slot; see radio profile for max |
| `Name` | `Channel.name` | Trim; skip row if empty | As stored | String pass-through | Case-sensitive |
| `Frequency` | `Channel.rxFrequency` | MHz → integer Hz | Hz → MHz (6 dp) | Lossless | RX frequency |
| `Duplex` | _(derive TX)_ | See duplex table | From RX/TX relationship | Lossless | `+`, `-`, empty, `off` |
| `Offset` | _(derive TX)_ | MHz offset magnitude | MHz offset magnitude | Lossless | Used with `Duplex` |
| `Tone` | tones | See tone mode table | Inverse | Lossy edge cases | `Tone`, `TSQL`, empty, etc. |
| `rToneFreq` | `Channel.rxTone` | CTCSS Hz → tone enum | Enum → Hz string | Lossless CTCSS | Receive tone frequency |
| `cToneFreq` | `Channel.txTone` | CTCSS Hz → tone enum | Enum → Hz string | Lossless CTCSS | Transmit tone frequency |
| `DtcsCode` | tones | DCS code component | Inverse | Lossy | Used with tone mode |
| `DtcsPolarity` | tones | `NN` / `NR` / … | Inverse | Lossy | |
| `RxDtcsCode` | tones | RX DCS when cross-mode | Inverse | Lossy | |
| `CrossMode` | tones | e.g. `Tone->Tone` | Inverse | Lossy | |
| `Mode` | `Channel.mode` | `NFM` → `fm`; `AM` → `am`; else `other` | `fm` → `NFM`; `am` → `AM` | Lossy for non-FM/AM | See [channel-modes.md](../channel-modes.md) |
| `TStep` | `Channel.bandwidthKHz` | kHz step string → number | Number → step string | Approximate | e.g. `5.00` → 12.5 kHz mapping TBD per profile |
| `Skip` | `Channel.scanSkip` | `S` → `true`; empty → `false` | Inverse | Lossless boolean | Scan list skip |
| `Power` | `Channel.power` | Wire string → percent | Percent → wire string | Profile-dependent | e.g. `5.0W`, `10W`, `1.0W` |
| `Comment` | `Channel.description` | Trim | As stored | String pass-through | |
| `URCALL` | — | Ignored (analogue) | Empty | N/A | DMR — not modelled |
| `RPT1CALL` | — | Ignored | Empty | N/A | DMR |
| `RPT2CALL` | — | Ignored | Empty | N/A | DMR |
| `DVCODE` | — | Ignored | Empty | N/A | DMR |

`Channel.txFrequency` is derived on import from `Frequency` + `Duplex` + `Offset`; not a separate column.

## Duplex wire forms

| `Duplex` | `Offset` | TX derivation |
| --- | --- | --- |
| empty | `0` | Simplex — TX = RX |
| `+` | MHz | TX = RX + offset |
| `-` | MHz | TX = RX − offset |
| `off` | `0` | Simplex (CHIRP convention for non-repeater) |

## Tone mode (`Tone` column)

| Wire `Tone` | Meaning |
| --- | --- |
| empty | No tone / carrier squelch |
| `Tone` | CTCSS tone on TX (use `cToneFreq`) |
| `TSQL` | Tone squelch — RX tone in `rToneFreq`, TX in `cToneFreq` |

DCS components use `DtcsCode`, `DtcsPolarity`, `RxDtcsCode`, `CrossMode` per CHIRP conventions.

## Mode wire forms

| CHIRP `Mode` | Internal `mode` |
| --- | --- |
| `NFM` | `fm` |
| `FM` | `fm` |
| `AM` | `am` |
| other | `other` |

## Power wire forms (examples)

Profile-specific ladders in [radios/](radios/README.md). Common fixture values:

| Wire | Typical mapping |
| --- | --- |
| `5.0W` | High (~100% or profile default) |
| `10W` | High |
| `25W` | High |
| `1.0W` | Low |

Exact percent mapping is profile-dependent at export.

## Related

- [CHIRP reference hub](README.md)
- [Radio profiles](radios/README.md)
- [Channel modes](../channel-modes.md)
