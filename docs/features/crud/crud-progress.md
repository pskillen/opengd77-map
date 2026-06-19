# CRUD — progress

**Branch:** `13/paddy/tg-rgl-contacts-crud`  
**Issues:** [#11](https://github.com/pskillen/codeplug-tool/issues/11), [#12](https://github.com/pskillen/codeplug-tool/issues/12), [#13](https://github.com/pskillen/codeplug-tool/issues/13), [#14](https://github.com/pskillen/codeplug-tool/issues/14)

## Status — channels & zones (#11, #12)

| Slice | Status | Notes |
| --- | --- | --- |
| Docs scaffold | Complete | `docs/features/crud/`, `docs/reference/bands.md`, `docs/features/maidenhead.md` |
| Route migration | Complete | `src/routes/channels/`, `src/routes/zones/` |
| Store mutations | Complete | channels/zones in `codeplugMutations.ts`, `codeplugStore` |
| Validation | Complete | `channel.ts`, `zone.ts` |
| Channel CRUD UI | Complete | create/edit/delete, list filters, band pills |
| Zone CRUD UI | Complete | create/edit/delete, `ZoneMemberPicker` |
| #11 extras | Partial | bands, maidenhead, hideFromMap, filters, location pick — export prefix deferred |

## Status — talk groups, RX group lists, contacts (#13, #14)

| Slice | Status | Notes |
| --- | --- | --- |
| Docs kickoff | Complete | README, progress, outstanding |
| Mutations | Complete | TG, contact, RGL + cascade helpers |
| Validation | Complete | `talkGroup.ts`, `contact.ts`, `rxGroupList.ts` |
| Store wiring | Complete | `codeplugStore` actions |
| Talk group CRUD UI | Pending | `TalkGroupEdit`, list/detail |
| RX group list CRUD UI | Pending | `RxGroupListEdit`, `RxGroupListMemberPicker` |
| Contact CRUD UI | Pending | `ContactEdit`, list/detail |
| Final docs / export verify | Pending | progress complete, optional roundtrip |

## Verify

- `npm run lint && npm run test && npm run build`
- `npm run dev` → talk groups, contacts, RX group lists routes
- Create/edit/delete TG, contact, RGL; rename/delete reference propagation
- RGL with >32 members saves in CRUD; export truncation is boundary-only
