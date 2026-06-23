# Composite page layouts

Higher-level shells built from layout primitives.

## ListPage

Standard list-route layout: `Page` + `PageHeader` + optional toolbar + children (typically `DataTable`).

| Prop          | Type        | Notes                                                 |
| ------------- | ----------- | ----------------------------------------------------- |
| `title`       | `string`    | Page heading                                          |
| `description` | `ReactNode` | Optional helper text                                  |
| `actions`     | `ReactNode` | Header actions slot                                   |
| `toolbar`     | `ReactNode` | Content above table (prefer `SectionNav` for filters) |
| `width`       | `PageWidth` | Default `default`                                     |

## FormPage

Edit-route shell with sticky footer on mobile (`max-width: 48em`).

| Prop          | Type              | Notes                               |
| ------------- | ----------------- | ----------------------------------- |
| `title`       | `string`          | Page heading                        |
| `description` | `ReactNode`       | Optional helper text                |
| `children`    | `ReactNode`       | Form fields                         |
| `footer`      | `ReactNode`       | Save/Cancel buttons                 |
| `onSubmit`    | `(event) => void` | Wraps children in `<form>` when set |
| `width`       | `PageWidth`       | Default `default`                   |

## FormSection

Titled field group (`Title order={3}`). Accordion variant deferred to #69.

## Related

- Layout primitives: [layout.md](layout.md)
