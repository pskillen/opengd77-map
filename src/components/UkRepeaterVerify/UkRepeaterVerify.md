# UkRepeaterVerify

## Purpose

On channel detail, query ukrepeater.net by callsign (or stored listing id), show a field diff, and apply selected updates. The **Check ukrepeater.net** button sits in the page header beside Edit and Delete.

## Props

| Prop      | Type      | Notes                  |
| --------- | --------- | ---------------------- |
| `channel` | `Channel` | Channel being verified |

## Behaviour

- No zone-membership warning on rename — UUID zone FKs are unaffected.
- Blocks apply when proposed name collides with another channel.
- Refreshes `meta.repeaterDirectory` snapshot on apply.
- **Title case names** checkbox (default on) in listing picker and diff modals — formats ETCC uppercase town/status (preserves dotted abbrevs like `N.I.`).

## Related

- [UkRepeaterSearch](../UkRepeaterSearch/UkRepeaterSearch.md)
- [repeater-directories docs](../../../docs/features/repeater-directories/README.md)
