# MapControls

## Purpose

Compact toolbar rendered above [`CodeplugMap`](CodeplugMap.md): two map display toggles and a link to map settings. Keeps per-page map options separate from global tile configuration on `/settings`.

## Props

| Prop                      | Type                       | Notes                                                          |
| ------------------------- | -------------------------- | -------------------------------------------------------------- |
| `fullChannelName`         | `boolean`                  | Whether markers use full channel name vs callsign (first word) |
| `onFullChannelNameChange` | `(value: boolean) => void` | Toggle handler                                                 |
| `showZones`               | `boolean`                  | Whether zone hulls are drawn                                   |
| `onShowZonesChange`       | `(value: boolean) => void` | Toggle handler                                                 |

## Usage

Used internally by `CodeplugMap` when `showControls` is true. To reuse standalone:

```tsx
import MapControls from '../components/CodeplugMap/MapControls.tsx';

<MapControls
  fullChannelName={fullName}
  onFullChannelNameChange={setFullName}
  showZones={showZones}
  onShowZonesChange={setShowZones}
/>;
```

The settings `ActionIcon` (`IconSettings` from Tabler) navigates to `/settings` (tile provider and Mapbox token).

## Behaviour

- State is owned by the parent (`CodeplugMap` holds `useState` for both checkboxes).
- Not persisted to `localStorage` — toggles reset when the component remounts.

## Related

- [`CodeplugMap.md`](CodeplugMap.md)
- [`src/routes/Settings.tsx`](../../routes/Settings.tsx)
