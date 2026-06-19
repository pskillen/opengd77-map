# Operator distance — progress

**Tracking:** [codeplug-tool#70](https://github.com/pskillen/codeplug-tool/issues/70)
**Branch:** `70/paddy/operator-distance`

---

## Overall status

**Status:** Complete (pending merge)

**PR:** https://github.com/pskillen/codeplug-tool/pull/71

---

## Delivered

| Slice | Commit | Notes |
| --- | --- | --- |
| Skill + docs scaffold | `docs(skills)`, `docs(operator-distance)` | Plan-mode reminder; feature folder |
| Distance utilities | `feat(geo)` | `geoDistance.ts` |
| Session position | `feat(state)` | `operatorPosition.tsx`, `main.tsx` |
| Map marker | `feat(map)` | `CodeplugMap` `operatorPosition` prop |
| Channel detail | `feat(channels)` | Distance field, Use/Clear |
| Channel list | `feat(channels)` | Sort, distance column, map |
| Zone detail | `feat(zones)` | Map marker |
| Documentation | `docs(operator-distance)` | Hub, cross-links, sidecars |

## Verify

- `npm run lint && npm run test && npm run build`
- `npm run dev` → manual verify checklist in [README.md](README.md)

---

## Next

- Merge PR #71
