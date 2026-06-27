# DM32 — Scan.csv

Zone-derived scan list export for Baofeng DM32 CPS ([#164](https://github.com/pskillen/codeplug-tool/issues/164)). Policy and gating: [zone-derived scan lists](../zone-derived-scan-lists.md).

Manual `ScanList` CRUD and import round-trip remain [#125](https://github.com/pskillen/codeplug-tool/issues/125).

---

## Export (zone-derived)

When `zone.exportScanList` and `options.exportZoneDerivedScanLists` are both enabled:

1. **`Scan.csv`** — one row per zone with scan export enabled; member column lists channel wire names (pipe-separated), filtered by `includeInScanList` and `scanSkip`.
2. **Scan carrier channel** — synthetic `Channels.csv` row named `{zone.name} Scan`; simplex on `scanCarrierFrequencyHz` or default **145.500 MHz**.
3. **Zone wiring** — carrier prepended as first zone member; carrier row's `Scan List` column = zone name.
4. **`Scan Tx Mode`** — `Last Actived Channel` on the scan list row.

Member cap: **16** per list (Baofeng DM32 profile). Export truncates with a warning when exceeded.

---

## Import

`Scan.csv` is **not imported** in v1. Channel `Scan List` column on imported rows is ignored. Re-import of operator exports that include synthetic carrier/scratch rows is out of scope until merge-candidate UI exists.

---

## Wire columns (export defaults)

| Column | Value |
| --- | --- |
| `Scan List Name` | Zone `name` |
| `Scan List Member` | Pipe-separated channel wire names (scan-eligible members) |
| `Scan Tx Mode` | `Last Actived Channel` |
| `Channels.csv` `Scan List` (carrier) | Zone `name` |
| `Channels.csv` `Name` (carrier) | `{zone.name} Scan` |

Full CPS column sets may include additional fields written as format defaults by the adapter — see [`src/lib/export/dm32/scanWire.ts`](../../../src/lib/export/dm32/scanWire.ts).

---

## Related

- [Zone-derived scan lists](../zone-derived-scan-lists.md)
- [DM32 zones](zones.md)
- [DM32 channels](channels.md)
