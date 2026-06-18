# ConfirmDeleteModal

## Purpose

Reusable confirmation dialog before deleting a channel, zone, or project entity.

## Props

| Prop         | Type         | Notes                                         |
| ------------ | ------------ | --------------------------------------------- |
| `opened`     | `boolean`    | Modal visibility                              |
| `onClose`    | `() => void` | Cancel / dismiss                              |
| `onConfirm`  | `() => void` | Confirm delete                                |
| `title`      | `string`     | Modal title                                   |
| `entityName` | `string`     | Shown in body                                 |
| `warning`    | `string`     | Optional extra warning (e.g. zone membership) |

## Usage

```tsx
<ConfirmDeleteModal
  opened={open}
  onClose={close}
  onConfirm={handleDelete}
  title="Delete channel"
  entityName={channel.name}
  warning="This channel is in 2 zones."
/>
```

## Related

- Channel/zone detail pages
- [ProjectList](../ProjectList/ProjectList.tsx) — similar pattern for projects
