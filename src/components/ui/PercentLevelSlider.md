# PercentLevelSlider

## Purpose

Percent level control for channel RF fields (power, squelch). Replaces coarse dropdowns with a Mantine [slider with marks](https://ui.mantine.dev/category/sliders/) at 5% steps. Supports `null` (radio default) via checkbox and shows the current value in the field label.

## Props

| Prop           | Type                              | Default         | Notes                                      |
| -------------- | --------------------------------- | --------------- | ------------------------------------------ |
| `label`        | `string`                          | —               | Field label (value appended after em dash) |
| `value`        | `number \| null`                  | —               | `null` = radio default                     |
| `onChange`     | `(value: number \| null) => void` | —               |                                            |
| `zeroLabel`    | `string`                          | —               | e.g. `Open (0%)` for squelch               |
| `defaultLabel` | `string`                          | `Radio default` | Checkbox + null label                      |
| `description`  | `string`                          | —               | Helper text below label                    |
| `min` / `max`  | `number`                          | `0` / `100`     | Slider bounds                              |
| `step`         | `number`                          | `5`             | Snap increment                             |

## Usage

```tsx
import { PercentLevelSlider } from '../components/ui/index.ts';

<PercentLevelSlider
  label="Power"
  value={channel.power}
  onChange={(power) => set('power', power)}
/>;

<PercentLevelSlider
  label="Squelch"
  value={channel.squelch}
  onChange={(squelch) => set('squelch', squelch)}
  zeroLabel="Open (0%)"
/>;
```

## Related

- Channel edit: `src/routes/channels/edit.tsx`
- Styleguide demo: `/#/styleguide`
