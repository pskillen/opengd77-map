# ReportPage

## Purpose

Shared page shell for read-only CPS report routes: centred `Container`, page title (`Title` order 1), and vertical spacing for child content.

## Props

| Prop       | Type        | Notes                                     |
| ---------- | ----------- | ----------------------------------------- |
| `title`    | `string`    | Main heading for the page                 |
| `children` | `ReactNode` | Page body (tables, maps, detail sections) |

## Usage

```tsx
import ReportPage from '../components/report/ReportPage.tsx';

export default function ChannelsList() {
  return <ReportPage title="Channels">{/* EntityTable, CodeplugMap, etc. */}</ReportPage>;
}
```

Detail routes typically add their own back link (arrow icon + list label, e.g. “Channels”) inside `children` rather than via `ReportPage` props.

## Behaviour

- `Container` size `lg`, vertical padding `md`.
- Does not render navigation or breadcrumbs — those come from `AppShell` navbar or per-route links.

## Related

- [`docs/features/report/`](../../../docs/features/report/README.md)
- List/detail routes under `src/routes/`
