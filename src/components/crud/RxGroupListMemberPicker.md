# RxGroupListMemberPicker

## Purpose

Multi-select RX group list membership editor. Members are vendor wire **names** from talk groups and private contacts, with export order preserved.

## Props

| Prop            | Type                        | Notes                |
| --------------- | --------------------------- | -------------------- |
| `talkGroups`    | `TalkGroup[]`               | Group call options   |
| `contacts`      | `Contact[]`                 | Private call options |
| `selectedNames` | `string[]`                  | Ordered member names |
| `onChange`      | `(names: string[]) => void` | Updated selection    |

## Behaviour

- No member-count cap in the internal model (export may truncate per radio profile).
- Dual-panel picker: available vs in-list, with filter, add/remove, and move up/down.
- Badges distinguish talk group vs private contact.
- Unresolved names already in `selectedNames` still appear in the in-list panel if not found in current talk groups/contacts.

## Related

- [RxGroupListEdit.tsx](../../routes/RxGroupListEdit.tsx)
- [codeplugMutations.ts](../../lib/codeplugMutations.ts) — `setRxGroupListMembers`
