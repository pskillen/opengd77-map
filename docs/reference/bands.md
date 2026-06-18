# UK amateur radio bands

Canonical reference for band labels, licence allocation MHz ranges, and UI pill colours. Implementation in `src/lib/bands.ts` must match this table. In-app band plan: `/#/reference/band-plan`.

**Source:** [RSGB Band Plan (effective 1 Jan 2024)](https://rsgb.services/public/bandplans/docs/240205_rsgb_band_plan_2024.pdf) — Ofcom **licence allocation** ranges, not RSGB sub-band usage segments.

**Disclaimer:** For programming convenience only. Not authoritative for on-air operation. Licence class, power, and geographic restrictions apply.

## Lookup behaviour

- Match channel **RX frequency** (or TX if RX blank) against each row’s min/max MHz (**inclusive**).
- First matching row wins (table ordered by increasing frequency).
- No per-channel lists; 60 m uses the full allocation span `5.2585 – 5.4065 MHz` (gaps between UK licence channels may still classify as 60 m).
- Unknown frequency: no pill or muted “?” styling.

NoV extensions (4 m 70.5–71.5, 2 m 146–147): inherit parent band colour; ranges documented in Notes column only.

## Colour design

**One colour per band.** Adjacent bands must be obviously different at a glance (e.g. 80 m / 60 m / 40 m). Distant bands may share a hue family.

## Band table

| ID | Label | Min (MHz) | Max (MHz) | Hex | Mantine | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `136khz` | 136 kHz | 0.1357 | 0.1378 | `#6741d9` | `violet.7` | Full only |
| `600m` | 600 m | 0.472 | 0.479 | `#1098ad` | `cyan.7` | Full only |
| `160m` | 160 m | 1.810 | 2.000 | `#ae3ec9` | `grape.6` | |
| `80m` | 80 m | 3.500 | 3.800 | `#4263eb` | `indigo.6` | |
| `60m` | 60 m | 5.2585 | 5.4065 | `#f59f00` | `yellow.7` | Simple range lookup |
| `40m` | 40 m | 7.000 | 7.200 | `#2f9e44` | `green.7` | |
| `30m` | 30 m | 10.100 | 10.150 | `#12b886` | `teal.6` | Secondary allocation |
| `20m` | 20 m | 14.000 | 14.350 | `#0ca678` | `teal.7` | |
| `17m` | 17 m | 18.068 | 18.168 | `#099268` | `teal.8` | |
| `15m` | 15 m | 21.000 | 21.450 | `#40c057` | `green.6` | |
| `12m` | 12 m | 24.890 | 24.990 | `#82c91e` | `lime.6` | |
| `10m` | 10 m | 28.000 | 29.700 | `#fab005` | `yellow.6` | |
| `6m` | 6 m | 50.000 | 52.000 | `#fd7e14` | `orange.6` | |
| `4m` | 4 m | 70.000 | 70.500 | `#fcc419` | `yellow.5` | NoV 70.5–71.5 inherits colour |
| `2m` | 2 m | 144.000 | 146.000 | `#e03131` | `red.7` | NoV 146–147 inherits colour |
| `70cm` | 70 cm | 430.000 | 440.000 | `#339af0` | `blue.5` | |
| `23cm` | 23 cm | 1240 | 1325 | `#7950f2` | `violet.6` | Radar sharing |
| `13cm` | 13 cm | 2310 | 2450 | `#868e96` | `gray.6` | Licence conditions apply |
| `9cm` | 9 cm | 3400 | 3475 | `#495057` | `gray.7` | Licence conditions apply |
| `6cm` | 6 cm | 5650 | 5850 | `#343a40` | `gray.8` | |
| `3cm` | 3 cm | 10000 | 10500 | `#212529` | `gray.9` | |
| `12cm` | 1.2 cm | 24000 | 24250 | `#495057` | `gray.7` | |
| `mm` | mm+ | 47000 | 300000 | `#868e96` | `gray.6` | Upper bound nominal |

## Related

- [CRUD feature](../features/crud/README.md)
- [Data model](../features/data-model/README.md)
