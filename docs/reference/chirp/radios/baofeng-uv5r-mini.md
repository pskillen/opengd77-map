# Baofeng UV-5R Mini — CHIRP profile

**Profile id:** `baofeng-uv5r-mini`  
**Fixture:** `sample-exports/Chirp 2026-06-29/Baofeng_UV-5R Mini_20251129.csv`

## Limits

| Constraint | Value | Export behaviour |
| --- | --- | --- |
| Max memory slots | 128 | Warn when channel count exceeds; truncate lowest-priority rows if forced |
| Modes | NFM, AM | Skip non-FM/AM internal modes with warning |

## Power ladder

| Wire string | Notes |
| --- | --- |
| `5.0W` | High — default for most channels in fixture |
| `1.0W` | Low — PMR446 channels in fixture |

## Filename convention

`Baofeng_UV-5R Mini_{YYYYMMDD}.csv`

## Related

- [Profile index](README.md)
- [channels.md](../channels.md)
