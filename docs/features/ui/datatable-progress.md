# UI datatable — progress

**Tracking:** [codeplug-tool#138](https://github.com/pskillen/codeplug-tool/issues/138)  
**Branch:** `138/pskillen/standardised-datatables`

## Slices

| Slice | Status | Notes |
| --- | --- | --- |
| 1 Core DataTable | Complete | Mantine Table extension; tests + styleguide |
| 2 Simple entity lists | Complete | Search in table toolbar; `?q=` preserved |
| 3 Embedded detail tables | Pending | |
| 4 Channels + section nav | Pending | |
| 5 Documentation | Pending | |

## Implementation decision

Extended Mantine `Table` + `ScrollArea` with sticky CSS module and Tabler sort icons — no new dependency.

## Verify

- `npm run lint && npm run test && npm run build`
- `/#/styleguide` — sort, sticky, column picker, selection
