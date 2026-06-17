# Build and deploy

How static tools in this monorepo reach **GitHub Pages**. There is no application bundler — the “build” is assembling a small folder of HTML, JS, and assets for hosting.

## Implementation status

| Area | Status | Notes |
| --- | --- | --- |
| Source layout | Shipped | Tools under `tools/<name>/`; site hub at `site/index.html` |
| CI workflow | Shipped | `.github/workflows/pages.yml` |
| Tag-triggered deploy | Shipped | Push `v*` tag → GitHub Actions → Pages |
| Merge-to-main auto deploy | Not used | Releases are explicit via tags only |

## Documentation map

| Doc | Covers |
| --- | --- |
| [README.md](../../README.md) | User-facing overview and live site link |
| [AGENTS.md](../../AGENTS.md) | Agent layout table and working principles |
| [docs/features/map/](../features/map/README.md) | Channel map behaviour and verify steps |

## Concepts

| Term | Meaning |
| --- | --- |
| **Source tree** | What lives in git — `tools/`, `site/`, docs, agent files |
| **Site artifact** | `_site/` folder CI builds per run: `index.html` + `tools/` |
| **Release tag** | Annotated or lightweight tag matching `v*` (e.g. `v1.0.0`) |
| **Project Pages URL** | `https://pskillen.github.io/opengd77-map/` |

## Repository layout (deploy-relevant)

| Path | Role |
| --- | --- |
| `site/index.html` | Pages root — lists available tools |
| `tools/<tool>/` | Deployed tool directories (`index.html`, sidecar `.js`, etc.) |
| `.github/workflows/pages.yml` | Tag-triggered deploy workflow |
| `docs/`, `.cursor/`, `AGENTS.md` | **Not** published — contributor/agent material only |

## Deploy flow

```mermaid
flowchart LR
  TAG[Push v* tag] --> WF[pages.yml workflow]
  WF --> PREP[Prepare _site]
  PREP --> ART[upload-pages-artifact]
  ART --> DEP[deploy-pages]
  DEP --> URL[pskillen.github.io/opengd77-map]
```

### Workflow steps

1. **Trigger** — `push` of a tag matching `v*` (e.g. `v1.0.0`).
2. **Prepare** — copy `site/index.html` → `_site/index.html` and `tools/` → `_site/tools/`.
3. **Upload** — `actions/upload-pages-artifact` with `path: _site`.
4. **Deploy** — `actions/deploy-pages` to the `github-pages` environment.

Workflow file: [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml).

### One-time repository setup

In GitHub **Settings → Pages**:

- **Source:** GitHub Actions (not “Deploy from a branch”).

The workflow needs `pages: write` and `id-token: write` (already set in the workflow).

## Cutting a release

From `main` after merging the release PR:

```bash
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0
```

Monitor the **Actions** tab for the “Deploy GitHub Pages” workflow. When it completes, the site updates at the project Pages URL.

Optional: create a **GitHub Release** from the same tag for release notes — the workflow runs on tag push, not on the Release UI alone.

## Local development

No build step is required for day-to-day work.

| Goal | Command / action |
| --- | --- |
| Run channel map | Open `tools/channel-map/index.html` in a browser, or `python -m http.server` from repo root and visit `/tools/channel-map/` |
| Preview site hub | Open `site/index.html` locally (tool links use relative paths) |
| Simulate CI output | `mkdir -p _site && cp site/index.html _site/ && cp -r tools _site/tools` then serve `_site/` |

Use CSV fixtures from gitignored `sample-exports/`.

## Adding a new tool

1. Add `tools/<slug>/index.html` (and sidecar JS/CSS as needed).
2. Link it from `site/index.html`.
3. Add contributor docs under `docs/features/<topic>/`.
4. Tag a release when ready to publish — no workflow change unless the tool lives outside `tools/`.

## Manual verify (post-deploy)

1. Open `https://pskillen.github.io/opengd77-map/`.
2. Follow **Channel map** → loads `tools/channel-map/`.
3. Load sample `Channels.csv` / `Zones.csv`; confirm markers and zone hulls render.

## Known gaps

- No staging environment — tag push updates production Pages.
- No cache-busting beyond browser defaults; bump tag to redeploy unchanged files.
- Workflow does not run on PRs (tag-only).

## Cross-links

| Resource | URL |
| --- | --- |
| Live site | https://pskillen.github.io/opengd77-map/ |
| Channel map (deployed) | https://pskillen.github.io/opengd77-map/tools/channel-map/ |
| Git workflow skill | [`.cursor/skills/git-workflow/SKILL.md`](../../.cursor/skills/git-workflow/SKILL.md) |
| Feature docs skill | [`.cursor/skills/feature-docs/SKILL.md`](../../.cursor/skills/feature-docs/SKILL.md) |
