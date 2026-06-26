# Codeplug CRUD

Create, edit, and delete codeplug entities against the internal vendor-neutral model, with validation and reference consistency on rename/delete.

**Tracking:** [codeplug-tool#11](https://github.com/pskillen/codeplug-tool/issues/11) · [#12](https://github.com/pskillen/codeplug-tool/issues/12) · [#13](https://github.com/pskillen/codeplug-tool/issues/13) · [#14](https://github.com/pskillen/codeplug-tool/issues/14)

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Channel CRUD | Complete | `src/routes/channels/` — multi-mode editor ([#46](https://github.com/pskillen/codeplug-tool/issues/46)); ukrepeater import ([#92](https://github.com/pskillen/codeplug-tool/issues/92)) |
| Zone CRUD | Complete | `src/routes/zones/` + `ZoneMemberPicker` |
| Talk group CRUD | Complete | `TalkGroupEdit`, list/detail |
| RX group list CRUD | Complete | `RxGroupListEdit`, `RxGroupListMemberPicker` |
| Contact CRUD | Complete | `ContactEdit`, list/detail |
| Store mutations | Complete | `codeplugMutations.ts`, `codeplugStore` |
| Validation | Complete | `src/lib/validation/` |
| Channel merge candidates | Complete | [#116](https://github.com/pskillen/codeplug-tool/issues/116) — post-hoc multi-mode merge detection and apply |
| Talk group merge candidates | Complete | [#142](https://github.com/pskillen/codeplug-tool/issues/142) — collapse per-slot TG duplicates import missed |
| RX group list member timeslots | Complete | [#142](https://github.com/pskillen/codeplug-tool/issues/142) — per-member slot on `RxGroupListMember` |

## Vendor boundaries

Internal models, mutations, validation, and CRUD UI are **vendor-neutral** — no radio profile constants or member-count caps. Cardinality limits and vendor column mapping apply at the **import/export boundary** only. See [AGENTS.md — Vendor boundaries](../../../AGENTS.md#vendor-boundaries) and [data-model](../data-model/README.md).

TG/RGL/contact CRUD follows the same rule: unlimited RGL members in the internal model; export may truncate per radio profile.

## Documentation map

| Doc | Role |
| --- | --- |
| [crud-progress.md](crud-progress.md) | Shipped slices and verify steps |
| [crud-outstanding.md](crud-outstanding.md) | Debt discovered during execution |
| [channel-merge-candidates-progress.md](channel-merge-candidates-progress.md) | Channel merge candidates ([#116](https://github.com/pskillen/codeplug-tool/issues/116)) |
| [channel-merge-candidates-outstanding.md](channel-merge-candidates-outstanding.md) | Merge candidates follow-ups |
| [data-model](../data-model/README.md) | Entity shapes |
| [bands reference](../../reference/bands.md) | UK band ranges and pill colours |
| [maidenhead](../maidenhead.md) | Locator conversion behaviour |
| [report](../report/README.md) | Read-only list/detail pages extended by CRUD |
| [repeater-directories](../repeater-directories/README.md) | ukrepeater.net search/add and verify ([#92](https://github.com/pskillen/codeplug-tool/issues/92)) |

## Concepts

- **Internal FKs:** Zone membership uses `memberChannelIds` (UUIDs). Channels use `contactRef` (`EntityRef | null`) and `rxGroupListId`. RX group lists store ordered `memberRefs` (`EntityRef[]`). Wire names from import live in `meta.imported` provenance only.
- **Rename/delete propagation:** Mutations clear or update id-based refs when a talk group, contact, or RX group list is deleted; renames do not rewrite channel refs (ids are stable).
- **Shared contact namespace:** `TalkGroup.name` and `Contact.name` must be unique across both arrays (display/export label invariant).
- **Export round-trip:** The export adapter serialises wire strings per target format; cardinality limits apply at export per [radio profiles](../../reference/opengd77/radios/README.md).

## Routes

| Path | Page |
| --- | --- |
| `/channels/add-from-ukrepeater` | Search ukrepeater.net and add channels ([#92](https://github.com/pskillen/codeplug-tool/issues/92)) |
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

- [Import / export](../import-export/README.md)
- Branch: `13/paddy/tg-rgl-contacts-crud`
