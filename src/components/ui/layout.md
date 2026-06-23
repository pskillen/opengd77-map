# UI layout primitives

Shared page chrome under `src/components/ui/`. Reference layout: import/export route.

## Page

Outer shell: `Container` + vertical `Stack`.

| Prop       | Type                              | Default     | Notes                                                        |
| ---------- | --------------------------------- | ----------- | ------------------------------------------------------------ |
| `width`    | `'narrow' \| 'default' \| 'wide'` | `'default'` | Maps to Mantine Container sizes via [`tokens.ts`](tokens.ts) |
| `children` | `ReactNode`                       | —           | Page content                                                 |

```tsx
import { Page, PageHeader } from '../components/ui/index.ts';

<Page width="default">
  <PageHeader title="Channels" description="All channels in the active codeplug." />
  {/* table, map, etc. */}
</Page>;
```

## PageHeader

`Title order={1}` with optional dimmed description and right-aligned actions on desktop.

| Prop          | Type                  | Notes                              |
| ------------- | --------------------- | ---------------------------------- |
| `title`       | `string`              | Page heading                       |
| `description` | `string \| ReactNode` | Helper text below title            |
| `actions`     | `ReactNode`           | Toolbar slot (e.g. primary button) |

## PageSection

Bordered card (`Paper withBorder`) for grouped content — matches import/export panels.

| Prop          | Type                  | Notes                         |
| ------------- | --------------------- | ----------------------------- |
| `title`       | `string`              | Section heading (`order={2}`) |
| `description` | `string \| ReactNode` | Subheading                    |
| `children`    | `ReactNode`           | Section body                  |

## PageSectionGrid

Responsive `SimpleGrid` — one column on mobile, two from `md` breakpoint.

## Related

- Tokens: [`tokens.ts`](tokens.ts)
- Feature doc: [docs/features/ui/README.md](../../../docs/features/ui/README.md)
