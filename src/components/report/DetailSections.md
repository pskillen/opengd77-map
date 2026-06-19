# DetailSections

## Purpose

Renders grouped read-only fields on entity detail pages. Each section has a heading and a responsive two-column grid of label/value pairs. Also exports `DetailLinkList` for related entities (e.g. zones containing a channel).

## Props — `DetailSections`

| Prop       | Type              | Notes                                   |
| ---------- | ----------------- | --------------------------------------- |
| `sections` | `DetailSection[]` | `{ title, fields: { label, value }[] }` |

`value` may be a `ReactNode` (plain text, `Anchor` links, badges).

## Props — `DetailLinkList`

| Prop    | Type                   | Notes                                   |
| ------- | ---------------------- | --------------------------------------- |
| `title` | `string`               | Section heading                         |
| `items` | `{ id, name, path }[]` | Linked entities; `path` is a hash route |

## Usage

```tsx
import DetailSections, { DetailLinkList } from '../components/report/DetailSections.tsx';

<DetailSections
  sections={[
    {
      title: 'Identity',
      fields: [
        { label: 'Name', value: channel.name },
        { label: 'Mode', value: 'Digital' },
      ],
    },
  ]}
/>

<DetailLinkList
  title="Zones"
  items={zones.map((z) => ({ id: z.id, name: z.name, path: `/zones/${z.id}` }))}
/>
```

## Behaviour

- Empty string values display as `—` in `DetailSections` (falsy check; custom nodes like links are passed through).
- `SimpleGrid` collapses to one column on small viewports.

## Related

- Detail routes: `ChannelDetail`, `ZoneDetail`, `TalkGroupDetail`, `ContactDetail`, `RxGroupListDetail`
