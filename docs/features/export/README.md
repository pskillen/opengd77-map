# Export

How internal [codeplug models](../data-model/README.md) leave the app as vendor CPS formats.

**Tracking:** [codeplug-tool#38](https://github.com/pskillen/codeplug-tool/issues/38)

## Problem

Import brings CPS data in; export serialises the internal models back to a format the vendor CPS accepts. OpenGD77 CPS CSV is the first export target.

The internal model is **radio-agnostic**. Radio-specific limits (member column counts, feature availability) are documented in [OpenGD77 radio profiles](../../reference/opengd77/radios/README.md) and are intended to be applied when the operator picks a target radio at export time. Today's exporter uses the [Baofeng 1701 profile](../../reference/opengd77/radios/baofeng-1701.md) without a profile picker UI.

## Implementation status


| Area                    | Status   | Notes                                                                       |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| Export registry         | Shipped  | `src/lib/export/`                                                           |
| OpenGD77 CSV            | Shipped  | Channels, Zones, Contacts, TG_Lists                                         |
| OpenGD77 ZIP bundle     | Shipped  | All 6 files via `fflate`; DTMF/APRS header-only                             |
| Export page (`/export`) | Shipped  | Nav link when a project is active                                           |
| Radio profile picker    | Planned  | Apply per-radio limits at export — see #43 follow-ups                       |
| qDMR YAML               | Deferred | [#37](https://github.com/pskillen/codeplug-tool/issues/37) — UI placeholder |
| Native YAML             | Deferred | [#10](https://github.com/pskillen/codeplug-tool/issues/10) — UI placeholder |
| Baofeng DM32 CPS        | Future   |                                                                             |
|                         |          |                                                                             |


## OpenGD77 export

- **Per-file download:** `Channels.csv`, `Zones.csv`, `Contacts.csv`, `TG_Lists.csv`
- **ZIP:** all six CPS files; `DTMF.csv` and `APRS.csv` are header-only (not modelled)
- **Route:** `/#/export` when a codeplug project is active

Code: `[src/lib/export/opengd77/](../../../src/lib/export/opengd77/)`, UI `[src/routes/Export.tsx](../../../src/routes/Export.tsx)`

## Wire format reference


| CPS file                        | Reference                                                 |
| ------------------------------- | --------------------------------------------------------- |
| All files — cross-cutting rules | [file-format.md](../../reference/opengd77/file-format.md) |
| `Channels.csv`                  | [channels.md](../../reference/opengd77/channels.md)       |
| `Zones.csv`                     | [zones.md](../../reference/opengd77/zones.md)             |
| `Contacts.csv`                  | [contacts.md](../../reference/opengd77/contacts.md)       |
| `TG_Lists.csv`                  | [tg-lists.md](../../reference/opengd77/tg-lists.md)       |
| `DTMF.csv` / `APRS.csv`         | [dtmf-aprs.md](../../reference/opengd77/dtmf-aprs.md)     |


## Documentation map


| Doc                                                           | Contents                                      |
| ------------------------------------------------------------- | --------------------------------------------- |
| [reference/opengd77/](../../reference/opengd77/README.md)     | Authoritative column and conversion reference |
| [import/opengd77.md](../import/opengd77.md)                   | Import adapter behaviour                      |
| [import/opengd77-progress.md](../import/opengd77-progress.md) | Execution log                                 |
| [data-model/README.md](../data-model/README.md)               | Entity definitions                            |


## Related

- [Import hub](../import/README.md)

