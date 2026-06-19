# CodeplugMap

## Purpose

Embeddable Leaflet map for plotting codeplug channels and zone hulls inside report pages. Replaces the former full-page `ChannelMap` sidebar layout; tile provider and Maidenhead grid settings live on `/settings` via [`useMapSettings`](../../hooks/useMapSettings.ts).

## Props

| Prop                     | Type                   | Default    | Notes                                                                 |
| ------------------------ | ---------------------- | ---------- | --------------------------------------------------------------------- |
| `channels`               | `Channel[]`            | —          | Channels to plot as markers (after internal filters)                  |
| `zones`                  | `Zone[]`               | `[]`       | Zones to draw hulls for when “Draw zones” is on                       |
| `allChannels`            | `Channel[]`            | `channels` | Full channel list for resolving zone member coords                    |
| `height`                 | `number \| string`     | `400`      | Map container height (px or CSS value)                                |
| `showControls`           | `boolean`              | `true`     | Show [`MapControls`](MapControls.md) above the map                    |
| `defaultFullChannelName` | `boolean`              | `false`    | Initial state for full-name marker labels                             |
| `defaultShowZones`       | `boolean`              | `true`     | Initial state for zone hull visibility                                |
| `highlightChannelId`     | `string`               | —          | Emphasise one channel marker (detail pages)                           |
| `operatorPosition`       | `{ lat, lon } \| null` | `null`     | Session operator position — distinct “You” marker; included in bounds |

## Usage

```tsx
import CodeplugMap from '../components/CodeplugMap/CodeplugMap.tsx';

// All channels + zones (channels list)
<CodeplugMap channels={codeplug.channels} zones={codeplug.zones} allChannels={codeplug.channels} />

// Single channel on detail page
<CodeplugMap
  channels={[channel]}
  zones={codeplug.zones}
  allChannels={codeplug.channels}
  highlightChannelId={channel.id}
/>

// One zone only (zone detail)
<CodeplugMap channels={members} zones={[zone]} allChannels={codeplug.channels} />
```

## Behaviour

- **Fixed filters** (not exposed in UI): `Use Location = Yes`, skip `0,0`, merge co-located markers.
- **Tiles:** reads provider/token from `localStorage` through `useMapSettings`; falls back to OSM when Mapbox is selected without a token.
- **Maidenhead grid:** optional overlay from Settings — maximum resolution Off / 4 / 6 / 8; finer detail unlocks by zoom (6-char at 9+, 8-char at 14+). See [maidenhead-grid doc](../../../docs/features/map/maidenhead-grid.md).
- **Zone hulls:** circle (1 site), line (2), convex polygon (3+); see [map zones doc](../../../docs/features/map/zones.md).
- **Operator marker:** when `operatorPosition` is set, plots a blue “You” marker and includes it in auto bounds. See [operator-distance doc](../../../docs/features/operator-distance/README.md).
- **Layout:** defers mount until document layout is ready (`useDocumentLayoutReady`); `ResizeObserver` keeps Leaflet sized in inset layouts.

## Related

- [`MapControls.md`](MapControls.md) — checkboxes above the map
- [`docs/features/map/`](../../../docs/features/map/README.md) — geography behaviour
- [`docs/features/report/`](../../../docs/features/report/README.md) — routes that embed this map
