# Display conventions

Shared rules for how values are shown in the UI.

## Frequencies (MHz)

Channel RX/TX frequencies are stored as strings (as imported from CPS CSV).

When displayed:

- **kHz-aligned** values (the MHz value rounds cleanly to 1 kHz) are shown with **three decimal places**, e.g. `145.775 MHz`.
- **Sub-kHz** values keep enough decimal places to preserve the stored value (at least three), e.g. `10.150250 MHz`.

Implementation: `formatFrequencyMhz()` in `src/lib/formatFrequency.ts`.

## Bands

UK amateur band pills use definitions in [bands.md](./bands.md). When RX and TX fall on different bands, show one pill per band (split operation).

## Icons

The SPA uses [Tabler Icons](https://tabler.io/icons) via `@tabler/icons-react` — the set Mantine documents and examples use.

### Sizes and stroke

Shared constants live in `src/lib/iconSizes.ts`:

| Constant | Value | Use |
| --- | --- | --- |
| `ICON_SIZE_NAV` | 16 | Navbar `NavLink`, back links, inline anchors |
| `ICON_SIZE_ACTION` | 18 | `ActionIcon`, compact buttons |
| `ICON_STROKE` | 1.5 | All Tabler icons |

### When to use icons

- **Do:** navigation, primary actions (New, Edit, Delete, Save, Import, Export), icon-only controls with `aria-label`.
- **Don't:** table cells, `Badge`/`BandPill`, mode labels, checkbox labels, or section headers unless they clearly aid grouping.

Pass icons via Mantine `leftSection` (or `rightSection` for forward arrows) and **keep the text label**.

### Imports

Import icons by name per file — e.g. `import { IconSettings } from '@tabler/icons-react'`. Do not barrel-re-export from a shared icons module (hurts tree-shaking).
