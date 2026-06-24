# Google Drive

Open and save **native YAML** and **CPS export files** from Google Drive ([#17](https://github.com/pskillen/codeplug-tool/issues/17)).

Hub: [cloud-storage](../README.md)

## Prerequisites

- Shipped **native YAML** ([#10](https://github.com/pskillen/codeplug-tool/issues/10))
- A **Google Cloud** project with **Google Drive API** enabled
- OAuth **Web application** client (public SPA — **no client secret**)

## GCP setup

1. [Google Cloud Console](https://console.cloud.google.com/) → create or select a project.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **OAuth consent screen** — External; add test users while in testing mode.
4. **Credentials → Create credentials → OAuth client ID → Web application**
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (local Vite dev)
     - `https://pskillen.github.io` (GitHub Pages — origin only, not `/codeplug-tool/`)
   - Do **not** create or embed a client secret for the SPA.

## Build-time client ID (not in git)

The OAuth **client ID** is injected at build time (public in the bundle once built — same as any SPA).

| Environment | Source |
| --- | --- |
| Local dev | `.env.local` → `GOOGLE_OAUTH_CLIENT_ID=...` (see [`.env.example`](../../../../.env.example)) |
| GitHub Pages | Repository secret `GOOGLE_OAUTH_CLIENT_ID` → [`.github/workflows/pages.yml`](../../../../.github/workflows/pages.yml) |
| PR CI | Omitted — build succeeds; Drive UI shows “not configured” |

### GitHub Actions secret (before first prod release with Drive)

**Settings → Secrets and variables → Actions → New repository secret**

- Name: `GOOGLE_OAUTH_CLIENT_ID`
- Value: GCP Web client ID

Publish a **full GitHub release** to deploy a Pages build with Drive enabled.

## Token storage

OAuth tokens persist in browser `localStorage` only:

- Key: `mm9pdy-codeplug-tool.cloud.google-drive.tokens`
- Scope: `https://www.googleapis.com/auth/drive.file` (files opened/created by the app)

Disconnect in **Settings** clears tokens; project data in LocalStorage is untouched.

## Operator flows

| Action | Behaviour |
| --- | --- |
| **Connect** | Settings → Connect Google Drive (GIS OAuth popup) |
| **Open YAML** | Home / Import & export → Open from Google Drive → pick `.yaml` |
| **Open CPS** | Pick a Drive folder (multi-file) or CSV (CHIRP) |
| **Save export** | Export panel → Save to Google Drive → pick folder, confirm dated file/subfolder name |

## Related

- [Build / deploy](../../../build/README.md) — `GOOGLE_OAUTH_CLIENT_ID` build variable
- [Native YAML](../import-export/native-yaml/README.md)
