# ImportIntoActivePanel

## Purpose

Import OpenGD77 CSV files into the **active** codeplug from the Import & export page. Supports **Merge** (idempotent name-based delta) and **Overwrite** (replace per entity type) with a confirm modal before apply.

## Props

| Prop           | Type                 | Notes                                                                                                     |
| -------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| `vendorFormat` | `VendorFormatOption` | From [`vendorFormats.ts`](../../lib/vendorFormats.ts); shows coming-soon alert when import is not shipped |

## Usage

```tsx
import ImportIntoActivePanel from '../components/ImportIntoActivePanel/ImportIntoActivePanel.tsx';
import { vendorFormatById } from '../lib/vendorFormats.ts';

<ImportIntoActivePanel vendorFormat={vendorFormatById('opengd77')} />;
```

## Behaviour

1. Operator selects Merge or Overwrite.
2. `ImportDropzone` parses files; `previewImportMerge` runs before apply.
3. Confirm modal shows file summary, entity stats, overwrite warnings, unresolved zone members.
4. Confirm calls `applyImportToActive(result, mode)`; inline summary shown after apply.

## Related

- [import README](../../../docs/features/import/README.md)
- [`ImportDropzone`](../ImportDropzone/ImportDropzone.tsx)
- [`importMerge.ts`](../../lib/importMerge.ts)
