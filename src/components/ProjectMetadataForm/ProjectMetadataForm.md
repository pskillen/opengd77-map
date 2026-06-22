# ProjectMetadataForm

## Purpose

Shared metadata form for codeplug project identity fields — used when **creating** a new codeplug (`/codeplug/new`) and when **editing** an existing project (`/summary/edit`).

## Props

| Prop            | Type                                    | Default  | Notes                                           |
| --------------- | --------------------------------------- | -------- | ----------------------------------------------- |
| `initialValues` | `ProjectMetadataFormValues`             | —        | Name, description, author, target radios, notes |
| `submitLabel`   | `string`                                | —        | Primary button text (e.g. `Create`, `Save`)     |
| `onSubmit`      | `(patch: ProjectMetadataPatch) => void` | —        | Called after validation; patch is sanitized     |
| `cancelHref`    | `string`                                | —        | Router path for Cancel button                   |
| `cancelLabel`   | `string`                                | `Cancel` | Cancel button text                              |
| `autoFocusName` | `boolean`                               | `false`  | Focus name field on mount (start-fresh flow)    |

## Usage

```tsx
import ProjectMetadataForm from '../components/ProjectMetadataForm/ProjectMetadataForm.tsx';

<ProjectMetadataForm
  initialValues={{ name: 'My codeplug', description: '', notes: '', author: '', targetRadios: [] }}
  submitLabel="Save"
  cancelHref="/summary"
  onSubmit={(patch) => updateProject(id, patch)}
/>;
```

## Behaviour

- Validates via [`validateProjectMetadata`](../../lib/validation/project.ts); shows first error inline.
- Does not persist — parent route/store commits on `onSubmit`.
- Back navigation is owned by the parent page (above this form).

## Related

- [`docs/features/codeplug-project/README.md`](../../../docs/features/codeplug-project/README.md)
- [`src/routes/project/edit.tsx`](../../routes/project/edit.tsx)
- [`src/routes/project/new.tsx`](../../routes/project/new.tsx)
