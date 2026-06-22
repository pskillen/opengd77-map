# RxGroupListMemberPicker

## Purpose

Multi-select RX group list membership editor. Members are `EntityRef` ids (talk group or private contact), with list order preserved.

## Props

| Prop           | Type                          | Notes                |
| -------------- | ----------------------------- | -------------------- |
| `talkGroups`   | `TalkGroup[]`                 | Group call options   |
| `contacts`     | `Contact[]`                   | Private call options |
| `selectedRefs` | `EntityRef[]`                 | Ordered member refs  |
| `onChange`     | `(refs: EntityRef[]) => void` | Updated selection    |

## Behaviour

- No member-count cap in the internal model (export may truncate per radio profile).
- Dual-panel picker: available vs in-list, with filter, add/remove, and move up/down.
- Badges distinguish talk group vs private contact.
- Unresolved refs already in `selectedRefs` still appear in the in-list panel if the entity id is missing from current talk groups/contacts.

## Related

- [RxGroupListEdit.tsx](../../routes/RxGroupListEdit.tsx)
- [codeplugMutations.ts](../../lib/codeplugMutations.ts) — `setRxGroupListMembers`
- [EntityRef helpers](../../lib/entityRefs.ts)
