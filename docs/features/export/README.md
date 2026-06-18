# Export

How internal [codeplug models](../data-model/README.md) leave the app as vendor CPS formats.

**Tracking:** [codeplug-tool#38](https://github.com/pskillen/codeplug-tool/issues/38)

## Problem

Import brings CPS data in; export serialises the internal models back to a format the vendor CPS accepts. OpenGD77 CPS CSV is the first export target.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Export registry | Shipped | `src/lib/export/` |
| OpenGD77 CSV | Shipped | Channels, Zones, Contacts, TG_Lists |
| OpenGD77 ZIP bundle | Shipped | All 6 files via `fflate`; DTMF/APRS header-only |
| Export page (`/export`) | Shipped | Nav link when a project is active |
| qDMR YAML | Deferred | [#37](https://github.com/pskillen/codeplug-tool/issues/37) — UI placeholder |
| Native YAML | Deferred | [#10](https://github.com/pskillen/codeplug-tool/issues/10) — UI placeholder |

## OpenGD77 export

- **Per-file download:** `Channels.csv`, `Zones.csv`, `Contacts.csv`, `TG_Lists.csv`
- **ZIP:** all six CPS files; `DTMF.csv` and `APRS.csv` are header-only (not modelled)
- **Route:** `/#/export` when a codeplug project is active

Code: [`src/lib/export/opengd77/`](../../../src/lib/export/opengd77/), UI [`src/routes/Export.tsx`](../../../src/routes/Export.tsx)

## Documentation map

| Doc | Contents |
| --- | --- |
| [import/opengd77.md](../import/opengd77.md) | CSV columns (import + export share headers) |
| [import/opengd77-progress.md](../import/opengd77-progress.md) | Execution log |
| [data-model/README.md](../data-model/README.md) | Entity definitions |

## Related

- [Import hub](../import/README.md)
