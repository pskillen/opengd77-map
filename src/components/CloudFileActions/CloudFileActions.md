# CloudFileActions

## Purpose

Google Drive **open** (import) and **save** (export) actions for Home and Import & export surfaces. Uses GIS OAuth tokens in `localStorage` and the Drive API v3 client under `src/lib/cloud/googleDrive/`.

## Props

| Prop                   | Type                          | Notes                                                                  |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `mode`                 | `'import' \| 'export'`        | Import opens a Drive browser modal; export uploads serialised payloads |
| `vendorFormatId`       | `VendorFormatId`              | Active CPS or native YAML format                                       |
| `profileId`            | `string`                      | Optional profile for CHIRP/OpenGD77/DM32 import                        |
| `onImportResult`       | `(result) => void`            | Import mode — parent applies merge/new project                         |
| `codeplug` / `project` | `Codeplug`, `CodeplugProject` | Export mode — passed to `buildExportPayload`                           |
| `exportOptions`        | `ExportOptions`               | Export mode — profile and name settings                                |
| `onComplete`           | `(message) => void`           | Export mode — optional status callback                                 |

## Usage

```tsx
<CloudFileActions
  mode="import"
  vendorFormatId="native-yaml"
  onImportResult={(result) => importNewProject(result)}
/>

<CloudFileActions
  mode="export"
  vendorFormatId="native-yaml"
  codeplug={codeplug}
  project={activeProject}
/>
```

## Behaviour

- Shown below a **Google Drive** divider so it is visually separate from local file actions.
- Buttons use the multicolor Google Drive product icon.
- Hidden when `GOOGLE_OAUTH_CLIENT_ID` was not injected at build time.
- Import: YAML single-file pick; CPS multi-file via folder CSV batch.
- Export: opens a save modal — pick destination folder, edit dated file/subfolder name, then upload.

## Related

- [Google Drive feature doc](../../../docs/features/cloud-storage/google-drive/README.md)
- [`CloudDriveBrowserModal.tsx`](./CloudDriveBrowserModal.tsx)
