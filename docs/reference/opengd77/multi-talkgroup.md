# OpenGD77 — multi-talkgroup denormalisation

**Status:** Planned — not implemented. Tracking: [codeplug-tool#36](https://github.com/pskillen/codeplug-tool/issues/36).

## Problem

The lean OpenGD77 model uses **one channel row per repeater/site** with promiscuous RX via TG lists. Some operator workflows (and other vendor formats such as qDMR) use **one row per repeater×talk-group** combination.

This reference doc will hold denormalisation rules when #36 is implemented:

- When to expand a single logical site into multiple `Channels.csv` rows
- Naming template for derived channel names (e.g. `{site} {tgName}`)
- Zone membership for expanded rows
- Contact / TG list assignment per expanded row
- Round-trip: can normalised rows collapse back to lean model on import?

## Placeholder constraints

Until specified in #36:

- Do not assume denormalisation in import or export adapters.
- Generic [channels](channels.md) and [tg-lists](tg-lists.md) semantics apply to each row independently.

## Related

- [#36 — multi-talkgroup](https://github.com/pskillen/codeplug-tool/issues/36)
- [TG lists](tg-lists.md)
- [Baofeng 1701 layout conventions](radios/baofeng-1701.md)
