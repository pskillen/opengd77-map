# Maidenhead grid overlay

Maidenhead locator grid lines and cell labels on `CodeplugMap` embeds — controlled from `/settings`.

**Tracking:** [codeplug-tool#50](https://github.com/pskillen/codeplug-tool/issues/50)

## Purpose

Gives geographic context when working with Maidenhead locators (channel CRUD display, [#47](../maidenhead.md) converter). Grid math matches [`src/lib/maidenhead.ts`](../../../src/lib/maidenhead.ts).

## Code anchors

| Path | Role |
| --- | --- |
| `src/lib/maidenheadGrid.ts` | `computeGridLines`, `computeGridLabels` for viewport bounds |
| `src/components/CodeplugMap/MaidenheadGridLayer.tsx` | Leaflet polylines + permanent cell labels |
| `src/hooks/useMapSettings.ts` | `maidenheadGrid` mode + `localStorage` persistence |
| `src/routes/Settings.tsx` | Grid overlay select control |

## Settings

Maximum locator precision — finer detail unlocks as you zoom in.

| Option | Max precision | Zoom &lt; 8 | Zoom 8–11 | Zoom ≥ 12 |
| --- | --- | --- | --- | --- |
| Off | `off` | none | none | none |
| Up to 4 characters | `4` | 4-char | 4-char | 4-char |
| Up to 6 characters | `6` | 4-char | 6-char | 6-char |
| Up to 8 characters | `8` | 4-char | 6-char | 8-char |

Lines are cumulative (coarser grids stay visible). Labels show only the finest active level.

**Storage key:** `mm9pdy-codeplug-tool.channel-map.maidenheadGrid` (browser `localStorage` only).

## Behaviour

- Viewport-scoped: lines and labels recompute on pan/zoom (`moveend` / `zoomend`).
- Setting value is **maximum resolution**; actual detail is the finest level allowed at the current zoom (thresholds: 6-char at zoom **8+**, 8-char at zoom **12+** when max permits).
- Rendered below zone hulls and channel markers.
- Subtle stroke/label styling so markers remain primary.
- Applies to all `CodeplugMap` embeds and the Maidenhead converter `MapLocationPicker`.

## Manual verify

1. `/settings` → **4-character grid** → open `/#/channels` with geolocated channels.
2. Confirm ~2° × 1° lines and 4-char labels (e.g. `IO85` over Glasgow).
3. Set **Up to 6 characters** → zoom out shows 4-char only; zoom to 8+ for 6-char lines/labels.
4. Set **Up to 8 characters** → zoom to 12+ for 8-char detail.
5. Pan/zoom → grid updates; setting persists after reload.
6. **Off** → no grid overlay.

## Related

- [Map tool README](README.md) · [Maidenhead conversion](../maidenhead.md)
