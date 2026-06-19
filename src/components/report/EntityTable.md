# EntityTable

## Purpose

Generic read-only data table for CPS entities. First column is always the entity name as a `Link` to its detail route; additional columns are defined per list page.

## Props

| Prop                 | Type                     | Notes                                           |
| -------------------- | ------------------------ | ----------------------------------------------- |
| `rows`               | `T[]`                    | Data rows (caller sorts, e.g. via `sortByName`) |
| `rowKey`             | `(row: T) => string`     | Stable React key (usually entity `id`)          |
| `nameColumn.getName` | `(row: T) => string`     | Display name                                    |
| `nameColumn.getPath` | `(row: T) => string`     | Hash route, e.g. `/channels/${id}`              |
| `nameColumn.header`  | `string`                 | Optional header (default `"Name"`)              |
| `columns`            | `EntityTableColumn<T>[]` | Extra columns: `key`, `header`, `render`        |

## Usage

```tsx
import EntityTable from '../components/report/EntityTable.tsx';

<EntityTable
  rows={sortedChannels}
  rowKey={(ch) => ch.id}
  nameColumn={{
    getName: (ch) => ch.name,
    getPath: (ch) => `/channels/${ch.id}`,
  }}
  columns={[
    { key: 'mode', header: 'Mode', render: (ch) => modeLabel(ch.mode) },
    { key: 'rx', header: 'RX MHz', render: (ch) => ch.rxFrequency || '—' },
  ]}
/>;
```

## Behaviour

- Wrapped in Mantine `ScrollArea` for long lists (no pagination in v1).
- Empty `rows` shows a single “No items” row.
- Name links use `react-router-dom` `Link` inside Mantine `Anchor`.

## Related

- [`reportLookup.ts`](../../lib/reportLookup.ts) — sort and relationship helpers for column data
- List routes: `ChannelsList`, `ZonesList`, `TalkGroupsList`, `ContactsList`, `RxGroupListsList`
