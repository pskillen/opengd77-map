# UI datatable — progress

**Tracking:** [codeplug-tool#138](https://github.com/pskillen/codeplug-tool/issues/138)  
**Branch:** `138/pskillen/standardised-datatables`

## Slices

| Slice | Status | Notes |
| --- | --- | --- |
| 1 Core DataTable | Complete | Mantine Table extension; tests + styleguide |
| 2 Simple entity lists | Complete | Search in table toolbar; `?q=` preserved |
| 3 Embedded detail tables | Complete | `variant=embedded`, header sort |
| 4 Channels + section nav | Complete | Column picker in table; header sort + URL sync |
| 5 Documentation | Complete | [README.md](README.md), component-kit logs |

## Implementation decision

Extended Mantine `Table` + `ScrollArea` with sticky CSS module and Tabler sort icons — no `mantine-datatable` dependency.

## Verify

- `npm run format:check && npm run lint && npm run test && npm run build`
- `/#/styleguide` — sort, sticky, column picker, selection, filtered-empty
- Entity list routes — header sort, table search, channels column picker persistence

## PR

Open with `Closes #138`.
