# SectionNav

## Purpose

Contextual secondary navigation (section 2) — resolves route-specific controls from [`sectionNavRegistry.ts`](../../nav/sectionNavRegistry.ts) and renders them as a desktop sidebar column or a mobile content toolbar.

## Props

| Prop      | Type                     | Notes                                                                  |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `variant` | `'sidebar' \| 'toolbar'` | `sidebar` in `AppShell.Navbar`; `toolbar` above main content on mobile |

## Usage

```tsx
import SectionNav from '../components/SectionNav/SectionNav.tsx';

// Desktop navbar column
<SectionNav variant="sidebar" />

// Mobile toolbar above routes
<SectionNav variant="toolbar" />
```

## Behaviour

- Uses `useLocation().pathname` to look up a [`SectionNavEntry`](../../nav/sectionNavTypes.ts) by prefix.
- Returns `null` when no registry entry matches (e.g. `/summary`, `/`).
- **Sidebar:** section title + `ScrollArea` wrapping the section component.
- **Toolbar:** `Paper` with title and wrapped controls.

## Related

- [`AppNav`](../AppNav/AppNav.md) — primary navigation
- Section implementations under `sections/`
- [#81](https://github.com/pskillen/codeplug-tool/issues/81)
