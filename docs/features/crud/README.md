# Codeplug CRUD

Create, edit, and delete codeplug entities against the internal vendor-neutral model, with validation and reference consistency on rename/delete.

**Tracking:** [codeplug-tool#11](https://github.com/pskillen/codeplug-tool/issues/11) · [#12](https://github.com/pskillen/codeplug-tool/issues/12) · [#13](https://github.com/pskillen/codeplug-tool/issues/13) · [#14](https://github.com/pskillen/codeplug-tool/issues/14)

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Channel CRUD | Complete | `src/routes/channels/` |
| Zone CRUD | Complete | `src/routes/zones/` + `ZoneMemberPicker` |
| Talk group CRUD | Complete | `TalkGroupEdit`, list/detail |
| RX group list CRUD | Complete | `RxGroupListEdit`, `RxGroupListMemberPicker` |
| Contact CRUD | Complete | `ContactEdit`, list/detail |
| Store mutations | Complete | `codeplugMutations.ts`, `codeplugStore` |
| Validation | Complete | `src/lib/validation/` |

## Vendor boundaries

Internal models, mutations, validation, and CRUD UI are **vendor-neutral** — no radio profile constants or member-count caps. Cardinality limits and vendor column mapping apply at the **import/export boundary** only. See [AGENTS.md — Vendor boundaries](../../../AGENTS.md#vendor-boundaries) and [data-model](../data-model/README.md).

TG/RGL/contact CRUD follows the same rule: unlimited RGL members in the internal model; export may truncate per radio profile.

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
- **Wire-name FKs:** Channels reference talk groups/contacts and RX group lists by **name**; RGL members are vendor names. Renames propagate; deletes clear or remove references.
- **Shared contact namespace:** `TalkGroup.name` and `Contact.name` must be unique across both arrays (internal FK rule).
- **Export round-trip:** Vendor CSV serialises names; cardinality limits at export per [radio profiles](../../reference/opengd77/radios/README.md).

## Routes

| Path | Page |
| --- | --- |
| `/channels/new` | Create channel |
| `/channels/:id/edit` | Edit channel |
| `/channels/:id` | Detail + edit/delete |
| `/zones/new` | Create zone |
| `/zones/:id/edit` | Edit zone + members |
| `/zones/:id` | Detail + edit/delete |
| `/talk-groups/new` | Create talk group |
| `/talk-groups/:id/edit` | Edit talk group |
| `/talk-groups/:id` | Detail + edit/delete |
| `/rx-group-lists/new` | Create RX group list |
| `/rx-group-lists/:id/edit` | Edit list + members |
| `/rx-group-lists/:id` | Detail + edit/delete |
| `/contacts/new` | Create contact |
| `/contacts/:id/edit` | Edit contact |
| `/contacts/:id` | Detail + edit/delete |

## Related

- [Import](../import/README.md) · [Export](../export/README.md)
- Branch: `13/paddy/tg-rgl-contacts-crud`
