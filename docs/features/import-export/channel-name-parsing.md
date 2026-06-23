# Channel wire name parsing

**Tracking:** [codeplug-tool#54](https://github.com/pskillen/codeplug-tool/issues/54)

## Purpose

CPS exports store one **wire name** per channel row (e.g. OpenGD77 `Channel Name`, CHIRP `Name`). The internal model stores **`callsign`** and **`name`** (human qualifier) separately, plus **`exportNameMode`** for how export composes the wire string again.

This document covers **import split** — shared across all import adapters (OpenGD77, DM32, CHIRP, …). Export composition is the inverse (`composeChannelWireName`) — see [data-model](../data-model/README.md).

## Code anchors

| Symbol | Location |
| --- | --- |
| `parseChannelWireName` | [`src/lib/channelNaming.ts`](../../../src/lib/channelNaming.ts) |
| Regional patterns | [`src/lib/channelNaming/patterns.ts`](../../../src/lib/channelNaming/patterns.ts) |
| `normalizeImportedChannelNaming` | [`src/lib/channelNaming.ts`](../../../src/lib/channelNaming.ts) |
| `composeChannelWireName` | [`src/lib/channelNaming.ts`](../../../src/lib/channelNaming.ts) |
| Import pipeline hook | Each adapter `parseChannels` — after merge collapse, before zones resolve |

## Inputs

- Verbatim **Channel Name** cell from CPS CSV (case preserved until normalisation).
- Not used for split: frequencies, mode, contacts — only the name string.

## Import pipeline order

1. Parse rows — store full wire string in `name` temporarily.
2. **Merge collapse** — multi-mode (`-F`/`-D`) and multi-talkgroup grouping on wire names ([`channelExpansion`](../../../src/lib/channelExpansion/)).
3. **Stamp provenance** — `meta.imported.channelWireName` (verbatim cell); `channelWireNames[]` when collapse merged multiple rows. Merge/re-import identity only — **never** read on export.
4. **`normalizeImportedChannelNaming`** — `parseChannelWireName` → `callsign`, `name`, `exportNameMode`.

## Behaviour

### Algorithm

```
prepareWire(wire)
  stripModeExportSuffix (-F / -D) for parsing only
  tokenize on whitespace

findCallsignToken(tokens)  // left-to-right
  first token matching a regional pattern (see callsigns.md)
  must contain ≥1 digit

if match:
  callsign = uppercase matched token
  name = join(remaining tokens, ' ')
  exportNameMode = callsign_name
else:
  callsign = ''
  name = prepared wire string
  exportNameMode = name_only
```

### Token normalisation

- Uppercase for pattern test; edge punctuation `.,;:` stripped per token.
- Internal `/` kept (`GB7GL/M` matches as one portable token).

### Portable suffixes

`GB7GL/M` is matched as a single token including `/M`. The slash suffix is part of the callsign token, not a separate qualifier.

### Edge cases

| Case | Treatment |
| --- | --- |
| `GB7GL Glasgow` | callsign `GB7GL`, name `Glasgow` |
| `Glasgow GB7GL` | Leftmost match — same split |
| `GB7GL-F` | Strip `-F` before parse → callsign `GB7GL`, empty name |
| `Local Simplex` | No digit token → name only |
| Multi-TG wire `GB7GL Scotland TS1` | Collapse merge runs **before** split; survivor wire name parsed after collapse |
| Mixed case `gb7gl Glasgow` | Normalised to `GB7GL` |

### Active-import merge

Re-import matches existing channels by stashed `channelWireName` / `channelWireNames` first, then composed wire name fallback. User edits to callsign/name/mode do not change the stash.

## Regional patterns

Phase-1 countries: UK, USA, Canada, Spain, Portugal, Italy, France, Poland, Germany. Full table: [callsigns.md](../../reference/callsigns.md).

## Manual verify

1. Import `test-data/opengd77/r2025.02.23.01/Channels.csv`.
2. Open a repeater channel — callsign and name split (e.g. `GB7GL` + town qualifier).
3. Re-import same file into active project — channels merge by wire stash, not display name alone.

## Known gaps

- Phase-2 ITU regions — [#136](https://github.com/pskillen/codeplug-tool/issues/136) (Benelux, Nordics, AU, JP, …).
- Non-amateur labels (`145.7750 MHz`) remain name-only.

## Related

- [callsigns.md](../../reference/callsigns.md) — pattern catalogue
- [data-model README](../data-model/README.md) — `Channel` fields
- [multi-talkgroup-expansion.md](../../reference/multi-talkgroup-expansion.md) — collapse before split
- [ukrepeater reference](../../reference/ukrepeater/README.md) — directory hydrate (not wire parse)
