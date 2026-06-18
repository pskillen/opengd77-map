# Channels and zones CRUD

Create, edit, and delete channels and zones against the internal codeplug model, with zone membership management and validation.

**Tracking:** [codeplug-tool#11](https://github.com/pskillen/codeplug-tool/issues/11) · [codeplug-tool#12](https://github.com/pskillen/codeplug-tool/issues/12)

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Store mutations | In progress | `src/lib/codeplugMutations.ts`, `codeplugStore` actions |
| Channel CRUD UI | Planned | `src/routes/channels/` |
| Zone CRUD UI | Planned | `src/routes/zones/` + membership picker |
| Validation | Planned | `src/lib/validation/` |
| Band pills / filters | Planned | [bands reference](../../reference/bands.md), `src/lib/bands.ts` |
| Maidenhead | Planned | [maidenhead.md](../maidenhead.md), `src/lib/maidenhead.ts` |

## Documentation map

| Doc | Role |
| --- | --- |
| [crud-progress.md](crud-progress.md) | Shipped slices and verify steps |
| [crud-outstanding.md](crud-outstanding.md) | Debt discovered during execution |
| [data-model](../data-model/README.md) | Entity shapes |
| [bands reference](../../reference/bands.md) | UK band ranges and pill colours |
| [maidenhead](../maidenhead.md) | Locator conversion behaviour |
| [report](../report/README.md) | Read-only list/detail pages extended by CRUD |

## Concepts

- **Internal FKs:** Zone membership uses `memberChannelIds` (UUIDs). `sourceMemberNames` is export wire only.
- **Export round-trip:** OpenGD77 `Zones.csv` serialises channel names; rebuilt from ids at mutation time.
- **80-member cap:** OpenGD77 zone limit enforced in UI and mutations.

## Routes (planned)

| Path | Page |
| --- | --- |
| `/channels/new` | Create channel |
| `/channels/:id/edit` | Edit channel |
| `/channels/:id` | Detail + edit/delete |
| `/zones/new` | Create zone |
| `/zones/:id/edit` | Edit zone + members |
| `/zones/:id` | Detail + edit/delete |

## Related

- [Import](../import/README.md) · [Export](../export/README.md)
- Branch: `11/paddy/channels-zones-crud`
