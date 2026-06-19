# CRUD — progress

**Branch:** `13/paddy/tg-rgl-contacts-crud`  
**Issues:** [#13](https://github.com/pskillen/codeplug-tool/issues/13), [#14](https://github.com/pskillen/codeplug-tool/issues/14)

## Status — talk groups, RX group lists, contacts (#13, #14)

| Slice | Status | Notes |
| --- | --- | --- |
| Docs kickoff | Complete | README, progress, outstanding |
| Mutations | Complete | TG, contact, RGL + cascade helpers |
| Validation | Complete | `talkGroup.ts`, `contact.ts`, `rxGroupList.ts` |
| Store wiring | Complete | `codeplugStore` actions |
| Talk group CRUD UI | Complete | `TalkGroupEdit`, list/detail |
| RX group list CRUD UI | Complete | `RxGroupListEdit`, `RxGroupListMemberPicker` |
| Contact CRUD UI | Complete | `ContactEdit`, list/detail |
| Final docs / export verify | Complete | data-model note, export truncation test |

## Verify

- `npm run lint && npm run test && npm run build`
- `npm run dev` → `/#/talk-groups`, `/#/contacts`, `/#/rx-group-lists`
- Create/edit/delete TG, contact, RGL; rename/delete reference propagation
- RGL with >32 members saves in CRUD; export truncates at profile cap (boundary test)

## Next

- Open PR closing #13 and #14
