# DataTable

## Purpose

Standardised entity list table: sticky header, column sort, optional toolbar (search, column picker, result count), and optional multi-select. Used on CRUD list routes and lighter **embedded** mode on detail pages.

## Props

| Prop                                            | Type                       | Default                          | Notes                                                    |
| ----------------------------------------------- | -------------------------- | -------------------------------- | -------------------------------------------------------- |
| `rows`                                          | `T[]`                      | —                                | Rows to display (may be pre-filtered by route)           |
| `rowKey`                                        | `(row: T) => string`       | —                                | Stable row id                                            |
| `nameColumn`                                    | `DataTableLinkedColumn<T>` | —                                | Linked name cell (required)                              |
| `callsignColumn`                                | `DataTableLinkedColumn<T>` | —                                | Optional leading linked column                           |
| `columns`                                       | `DataTableColumn<T>[]`     | —                                | Additional columns                                       |
| `variant`                                       | `'list' \| 'embedded'`     | `'list'`                         | Embedded hides search/column picker/selection by default |
| `sort` / `onSortChange` / `defaultSort`         | `DataTableSortState`       | internal                         | Controlled or uncontrolled header sort                   |
| `search` / `onSearchChange`                     | `string`                   | —                                | Controlled search; pair with `showSearch`                |
| `showSearch`                                    | `boolean`                  | `true` when `onSearchChange` set | Toolbar search input                                     |
| `columnVisibility` / `onColumnVisibilityChange` | `string[]`                 | —                                | Controlled hideable column keys                          |
| `columnVisibilityStorageKey`                    | `string`                   | —                                | Per-project `localStorage` key for hideable columns      |
| `columnVisibilityLoad`                          | `() => string[]`           | —                                | Custom load (schema migration, legacy key copy)          |
| `selectable`                                    | `boolean`                  | `false`                          | Checkbox column for bulk selection                       |
| `selectedKeys` / `onSelectedKeysChange`         | `string[]`                 | internal                         | Controlled selection                                     |
| `totalRowCount`                                 | `number`                   | —                                | Unfiltered count; enables filtered-empty copy            |
| `filteredEmptyMessage`                          | `string`                   | `'No matches'`                   | When `rows` empty but `totalRowCount > 0`                |
| `emptyState`                                    | `ReactNode`                | `EmptyState`                     | Truly empty table                                        |
| `toolbar`                                       | `ReactNode`                | —                                | Trailing toolbar slot                                    |
| `mobileColumnPolicy`                            | `'none' \| 'collapse'`     | `'none'`                         | #68 extension point                                      |

### Column fields

| Field            | Notes                                                      |
| ---------------- | ---------------------------------------------------------- |
| `sortable`       | Default `true` when `sortValue` is set                     |
| `sortValue`      | `string \| number \| null` for comparator; nulls sort last |
| `hideable`       | Shown in column picker when `true`                         |
| `defaultVisible` | Initial visibility for hideable columns (default `true`)   |

## Usage

```tsx
import { DataTable } from '../components/ui/index.ts';
import { useListNameQuery, filterRowsByName } from '../hooks/useListNameQuery.ts';

const { nameFilter, setNameFilter } = useListNameQuery('contacts');
const filtered = useMemo(
  () => filterRowsByName(contacts, nameFilter, (c) => c.name),
  [contacts, nameFilter],
);

<DataTable
  variant="list"
  rows={filtered}
  totalRowCount={contacts.length}
  rowKey={(c) => c.id}
  search={nameFilter}
  onSearchChange={setNameFilter}
  searchPlaceholder="Filter name…"
  nameColumn={{ getName: (c) => c.name, getPath: (c) => `/contacts/${c.id}` }}
  columns={[
    {
      key: 'id',
      header: 'ID',
      render: (c) => c.identifier,
      sortValue: (c) => c.identifier,
    },
  ]}
/>;
```

## Behaviour

- **Sort:** click header toggles asc/desc on same column; new column starts asc. Name/callsign use internal sort keys.
- **Sticky header:** `Table.Th` sticks inside bounded `ScrollArea` (`mah` 60vh list, 40vh embedded).
- **Column picker:** `MultiSelect` for columns with `hideable: true`. Pass a per-project `columnVisibilityStorageKey` (e.g. `channelListColumnsKey(activeProjectId)`) and optional `columnVisibilityLoad` for schema migration.
- **Selection:** header checkbox selects all visible rows; row checkboxes do not block link navigation.
- **Empty states:** `rows.length === 0` with `totalRowCount > 0` shows `filteredEmptyMessage`; otherwise `emptyState`.

## Related

- Sort helpers: [`src/lib/dataTable/sort.ts`](../../lib/dataTable/sort.ts)
- Column visibility hook: [`useDataTableColumnVisibility`](../../hooks/useDataTableColumnVisibility.ts)
- Feature docs: [docs/features/ui/README.md](../../../docs/features/ui/README.md)
- Tracking: [#138](https://github.com/pskillen/codeplug-tool/issues/138)
