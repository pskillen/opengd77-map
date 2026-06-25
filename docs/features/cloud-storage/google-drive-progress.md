# Google Drive — progress

**Tracking:** [codeplug-tool#17](https://github.com/pskillen/codeplug-tool/issues/17)
**Branch:** `10/paddy/native-yaml-google-drive`

---

## Overall status

**Status:** Complete (pending merge)

---

## Delivered

- Build-time `GOOGLE_OAUTH_CLIENT_ID` via GH Actions secret + `.env.local`
- `src/lib/cloud/googleDrive/` — OAuth, Drive API, tests
- `CloudFileActions` + Settings connect UI
- `src/lib/fileDelivery/` — shared export/import payloads for Drive upload

---

## Verify

- Set `GOOGLE_OAUTH_CLIENT_ID` in `.env.local` → Settings → Connect → Open/Save
- Before Pages release: add `GOOGLE_OAUTH_CLIENT_ID` repository secret

---

## Next

- Dropbox #15 / OneDrive #16 (interface only today)
