# UkRepeaterSearch

## Purpose

Search ukrepeater.net (RSGB ETCC API) and add repeater listings as channels to the active codeplug.

## Usage

```tsx
// Route: /channels/add-from-ukrepeater
import UkRepeaterSearch from '../components/UkRepeaterSearch/UkRepeaterSearch.tsx';
```

## Behaviour

- Search mode `Select`: Auto, Postcode, Address, Town, Repeater callsign, Keeper callsign, Locator, Band.
- Auto-detects query kind when mode is Auto (postcode before callsign; locator; band; etc.).
- Location modes geocode via Mapbox (when Settings token set) or Photon, then query `/locator/`; shows resolved address and locator square.
- Operational-only filter on by default.
- Title case names on by default (DERBY → Derby for channel qualifier and comment).
- Skips listings without FM/DMR; blocks duplicate **callsigns** (not channel name qualifiers). Results table **Status** column shows add eligibility (Ready, duplicate callsign, skip reason).
- Multi-mode FM+DMR listings map to one `multiMode` channel.

## Related

- [repeater-directories feature docs](../../../docs/features/repeater-directories/README.md)
- [ukrepeater reference](../../../docs/reference/ukrepeater/README.md)
