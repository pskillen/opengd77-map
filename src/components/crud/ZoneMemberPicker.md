# ZoneMemberPicker

## Purpose

Multi-select channel membership editor for zone create/edit forms. Preserves member order (`memberChannelIds` order is significant and survives to export).

## Props

| Prop          | Type                      | Notes                         |
| ------------- | ------------------------- | ----------------------------- |
| `channels`    | `Channel[]`               | Project channels to pick from |
| `selectedIds` | `string[]`                | Ordered member channel ids    |
| `onChange`    | `(ids: string[]) => void` | Updated selection             |

## Behaviour

- Selected list shows reorder controls (↑/↓); order is preserved through to export.
- Uses internal channel **ids**; names displayed for UI only.
- No member-count cap in the internal model — OpenGD77 export warns and truncates per radio profile ([#132](https://github.com/pskillen/codeplug-tool/issues/132)).

## Related

- [zones/edit.tsx](../../routes/zones/edit.tsx)
- [codeplugMutations.ts](../../lib/codeplugMutations.ts) — `setZoneMembers`
