# Baofeng UV-21Pro V2 — CHIRP profile

**Profile id:** `baofeng-uv21prov2`  
**Fixture:** `sample-exports/Chirp 2026-06-29/Baofeng_UV-21ProV2_20251129.csv`

## Limits

| Constraint | Value | Export behaviour |
| --- | --- | --- |
| Max memory slots | 128 | Warn when channel count exceeds |
| Modes | NFM, AM | Includes airband `AM` row in fixture (e.g. SAR Air Scen) |

## Power ladder

| Wire string | Notes |
| --- | --- |
| `5.0W` | High |
| `1.0W` | Low (PMR446) |

## Filename convention

`Baofeng_UV-21ProV2_{YYYYMMDD}.csv`

## Related

- [Profile index](README.md)
