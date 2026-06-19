# UseMyLocationButton

## Purpose

Shared button that reads the operator’s **current device position** via the browser Geolocation API and passes WGS84 coordinates to the parent. Used on:

- Channel **edit** and the Maidenhead **converter** — seed channel/converter coordinates (#59)
- Channel **detail**, **list**, and zone **detail** — set **session** operator position for distance and map context ([#70](../operator-distance/README.md))

Not to be confused with the converter’s channel **Use location** button, which copies coordinates from a selected codeplug channel.

## Props

| Prop         | Type                                  | Default | Notes                                                                    |
| ------------ | ------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `onLocation` | `(lat, lon, accuracyMeters?) => void` | —       | Called on success; third arg is browser-reported accuracy when available |
| `disabled`   | `boolean`                             | —       | Disables the button (e.g. while form is read-only)                       |

## Usage

```tsx
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import { useOperatorPosition } from '../../state/operatorPosition.tsx';

// Channel edit — sets lat/lon, locator, and useLocation via applyCoords
<UseMyLocationButton onLocation={(lat, lon) => applyCoords(lat, lon)} />;

// Browse views — session position (not persisted)
const { setPosition } = useOperatorPosition();
<UseMyLocationButton
  onLocation={(lat, lon, accuracyMeters) =>
    setPosition({ lat, lon, accuracyMeters: accuracyMeters ?? null })
  }
/>;
```

## Behaviour

- **User gesture only:** click triggers `navigator.geolocation.getCurrentPosition` (one-shot; no continuous tracking).
- **Loading:** Mantine button shows loading state while the request is pending.
- **Errors:** inline red text for permission denied, unavailable position, timeout, or insecure context; does not block the rest of the form.
- **Accuracy:** when the browser reports accuracy, shows dimmed helper text (e.g. `±12 m`).
- **Privacy:** position is not sent to any server. On edit/converter, parents persist only when the user saves a channel or copies values manually. On browse views, parents store in session context only.

## Related

- [`useGeolocation`](../../hooks/useGeolocation.ts) — React state wrapper
- [`useOperatorPosition`](../../state/operatorPosition.tsx) — session browse position
- [`geolocation.ts`](../../lib/geolocation.ts) — Geolocation API wrapper and typed errors
- [Maidenhead feature doc](../../../docs/features/maidenhead.md) — edit/converter geolocation
- [Operator distance](../../../docs/features/operator-distance/README.md) — browse distance and map marker
