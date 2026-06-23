# Display conventions

Shared rules for how values are shown in the UI.

## Frequencies (MHz)

Channel RX/TX frequencies are stored as strings on `Channel.rxFrequency` / `Channel.txFrequency`.

When displayed:

- **kHz-aligned** values (the MHz value rounds cleanly to 1 kHz) are shown with **three decimal places**, e.g. `145.775 MHz`.
- **Sub-kHz** values keep enough decimal places to preserve the stored value (at least three), e.g. `10.150250 MHz`.

Implementation: `formatFrequencyMhz()` in `src/lib/formatFrequency.ts`.

## Bands

Band pills use definitions in [bands.md](./bands.md). Lookup covers UK amateur allocations and common non-amateur receive services (broadcast, airband, marine, PMR446).

| Category | Pill style | When shown |
| --- | --- | --- |
| Amateur (`amateur`) | Solid fill, white label text | Frequency in an Ofcom amateur allocation |
| Non-amateur (`broadcast`, `airband`, `marine`, `pmr`) | Outline, coloured border and label | Frequency in a documented service range |

When RX and TX fall on different bands, show one pill per band (split operation). Unknown frequency: no pill.

**Disambiguation:** broadcast LW (148.5–285 kHz) and amateur 136 kHz (135.7–137.8 kHz) use different IDs and colours — see the disambiguation table in [bands.md](./bands.md).

## Channel modes

Mode pills and map marker colours use definitions in [channel-modes.md](./channel-modes.md).

## Channel naming ([#54](https://github.com/pskillen/codeplug-tool/issues/54))

| Field / control | Rule |
| --- | --- |
| **Callsign** | Default map marker label; ukrepeater search key |
| **Name** | Human qualifier in lists and detail — not the composed CPS wire string |
| **Export name mode** | Select in channel edit — `callsign_name`, `callsign_only`, `name_only`, `callsign_suffix` |
| **Wire name preview** | Read-only `composeChannelWireName` from form state (edit) or model (detail) |
| **Full channel name** (map toggle) | `callsign — name` qualifier parts — not the export wire string |
| **Comment** | Internal notes; labelled “not exported to CPS” in edit form |

Implementation: [`src/lib/channelNaming.ts`](../../../src/lib/channelNaming.ts), [`channel-name-parsing.md`](../features/import-export/channel-name-parsing.md).

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

## Navigation badges

Primary nav entity counts use Mantine `Badge` in `AppNav` (`src/components/AppNav/AppNav.tsx`):

- `variant="outline"` and `color="gray"` — neutral totals, not notification semantics.
- Shown in `NavLink` `rightSection` when the active codeplug has **one or more** of that entity.
- Hidden when count is 0 or when no project is active.
- Badged routes: Channels, Zones, Talk groups, Contacts, RX Group Lists.

## Two-section navigation

Desktop (`sm+`): primary column (`AppNav`, ~260px) + secondary column (`SectionNav`, ~220px). Mobile: primary in burger drawer; secondary renders as a toolbar above route content.

Registry: `src/nav/sectionNavRegistry.ts` maps pathname prefixes to section components under `src/components/SectionNav/sections/`. Filter state prefers URL search params (`?q=`, channel filters, `?format=` for vendor interchange).
