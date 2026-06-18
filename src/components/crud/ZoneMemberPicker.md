# ZoneMemberPicker

## Purpose

Multi-select channel membership editor for zone create/edit forms. Preserves member order (OpenGD77 `Channel1`…`Channel80` export order).

## Props

| Prop          | Type                      | Notes                         |
| ------------- | ------------------------- | ----------------------------- |
| `channels`    | `Channel[]`               | Project channels to pick from |
| `selectedIds` | `string[]`                | Ordered member channel ids    |
| `onChange`    | `(ids: string[]) => void` | Updated selection             |

## Behaviour

- Enforces OpenGD77 80-member cap (`OPENGD77_MAX_ZONE_MEMBERS`).
- Selected list shows reorder controls (↑/↓) for export column order.
- Uses internal channel **ids**; names displayed for UI only.

## Related

- [zones/edit.tsx](../../routes/zones/edit.tsx)
- [codeplugMutations.ts](../../lib/codeplugMutations.ts) — `setZoneMembers`
