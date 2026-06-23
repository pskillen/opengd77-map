# ReportPage

## Purpose

**Deprecated** — thin wrapper around [`Page`](../ui/Page.tsx) + [`PageHeader`](../ui/PageHeader.tsx). New routes should import from `src/components/ui/` directly.

## Props

| Prop          | Type        | Notes                        |
| ------------- | ----------- | ---------------------------- |
| `title`       | `string`    | Page heading                 |
| `description` | `ReactNode` | Optional (added during #105) |
| `children`    | `ReactNode` | Page body                    |

## Related

- Replacement: [layout.md](../ui/layout.md)
- Tracking: [codeplug-tool#105](https://github.com/pskillen/codeplug-tool/issues/105)
