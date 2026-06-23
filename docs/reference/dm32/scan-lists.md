# DM32 — Scan.csv _(deferred)_

Scan lists are **out of scope** for [#67](https://github.com/pskillen/codeplug-tool/issues/67). Tracking: [#125](https://github.com/pskillen/codeplug-tool/issues/125).

Until then:

- `Scan.csv` is skipped on import.
- Channel `Scan List` column is ignored on import; export writes `None`.
- `Scan.csv` is omitted from export ZIP.

See operator-repo [`dm32-codeplug-csv`](../../../../dmr-programming/.cursor/skills/dm32-codeplug-csv/SKILL.md) for wire layout when implemented.
