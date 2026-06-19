# NotFoundEntity

## Purpose

Friendly fallback when a detail route’s `:id` does not match any entity in the active codeplug (stale bookmark, deleted import row, or manual URL edit).

## Props

| Prop          | Type     | Notes                                            |
| ------------- | -------- | ------------------------------------------------ |
| `entityLabel` | `string` | Human label, e.g. `"Channel"`, `"RX Group List"` |
| `listPath`    | `string` | Hash route back to the parent list               |

## Usage

```tsx
import NotFoundEntity from '../components/report/NotFoundEntity.tsx';

const channel = findEntityById(codeplug.channels, id);
if (!channel) {
  return (
    <ReportPage title="Channel">
      <NotFoundEntity entityLabel="Channel" listPath="/channels" />
    </ReportPage>
  );
}
```

## Behaviour

- Renders a short message and a “Back to list” link.
- Wrapped in `ReportPage` on detail routes so navbar context stays consistent.

## Related

- [`findEntityById`](../../lib/reportLookup.ts) — id lookup helper used before rendering this component
