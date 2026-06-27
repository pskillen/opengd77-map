# Zone-derived scan lists — progress

**Tracking:** [#164](https://github.com/pskillen/codeplug-tool/issues/164), [#163](https://github.com/pskillen/codeplug-tool/issues/163)  
**Branch:** `164/pskil/zone-derived-scan-lists`

## Status

| Slice | Status | Notes |
| --- | --- | --- |
| Model + migration v18 | Complete | `Zone.members`, export flags, `ExportOptions` gates |
| Scratch channel export | Complete | `appendScratchChannelsForExport`, zone fan-out |
| DM32 Scan.csv synthesis | Complete | `zoneDerivedScanLists/`, carrier inject, round-trip tests |
| CRUD + export UI | Complete | Zone toggles, member scan inclusion, DM32 master switches |
| Docs | Complete | Tier-2 `zone-derived-scan-lists.md`, tier-3 DM32 scan/scratch |

## Commits

1. `feat(model): zone export flags for scratch and scan lists`
2. `feat(export): zone-gated scratch channel rows`
3. `feat(dm32): zone-derived Scan.csv and scan carrier export`
4. `feat(ui): zone export flags and DM32 scan/scratch master toggles`
5. `docs: zone-derived scan lists and scratch channel export`

## Next

Open PR — `Closes #164`, `Closes #163`.
