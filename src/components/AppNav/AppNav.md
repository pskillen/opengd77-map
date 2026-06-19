# AppNav

## Purpose

Primary (section 1) application navigation — project routes, `ActiveProjectBar`, and global Reference/Settings links. Renders inside the left column of the two-section `AppShell` navbar.

## Props

| Prop         | Type         | Default | Notes                                                           |
| ------------ | ------------ | ------- | --------------------------------------------------------------- |
| `onNavClick` | `() => void` | —       | Called when a nav link is clicked (closes mobile burger drawer) |

## Usage

```tsx
import AppNav from '../components/AppNav/AppNav.tsx';

<AppNav onNavClick={close} />;
```

## Behaviour

- Without an active project: shows **Home** only (plus Reference and Settings at the bottom).
- With an active project: shows `ActiveProjectBar`, project entity routes from [`primaryNavItems.ts`](../../nav/primaryNavItems.ts), then Reference/Settings.
- Entity count badges (`Badge variant="outline" color="gray"`) appear on nav items with a `countKey` when count &gt; 0. See [display-conventions.md](../../../docs/reference/display-conventions.md).
- Active state uses [`navActive()`](../../nav/navActive.ts) for prefix matching.

## Related

- [`SectionNav`](../SectionNav/SectionNav.md) — contextual secondary column
- [nav-progress.md](../../../docs/features/ui/nav-progress.md) — [#81](https://github.com/pskillen/codeplug-tool/issues/81)
