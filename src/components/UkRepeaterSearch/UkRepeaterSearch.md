# UkRepeaterSearch

## Purpose

Search ukrepeater.net (RSGB ETCC API) and add repeater listings as channels to the active codeplug.

## Usage

```tsx
// Route: /channels/add-from-ukrepeater
import UkRepeaterSearch from '../components/UkRepeaterSearch/UkRepeaterSearch.tsx';
```

## Behaviour

- Auto-detects query kind: callsign, Maidenhead locator, band token, or town (geocode → locator).
- Operational-only filter on by default.
- Title case names on by default (DERBY → Derby for channel qualifier and comment).
- Skips listings without FM/DMR; blocks name collisions with existing channels.
- Multi-mode FM+DMR listings map to one `multiMode` channel.

## Related

- [repeater-directories feature docs](../../../docs/features/repeater-directories/README.md)
- [ukrepeater reference](../../../docs/reference/ukrepeater/README.md)
