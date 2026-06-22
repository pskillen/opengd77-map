---
name: git-workflow
description: >-
  Git workflow for codeplug-tool — single monorepo of static browser tools on
  GitHub Pages. Plan with GitHub issues, branch by issue when tracked, use
  conventional commits, open PRs with linked tickets. Use when starting features,
  committing, or opening pull requests in this repo.
---

# codeplug-tool Git Workflow

## Overview

This repo is a **single Vite + React + TypeScript SPA** at the repo root (features live under `src/`), deployed to **GitHub Pages** when a **full GitHub release is published** (not a pre-release). One issue, one branch, one PR — no cross-repo coordination.

Workflow: plan → issue (when non-trivial) → branch → commit → PR → merge to `main` → publish a GitHub release to publish Pages.

Use the **`user-github-personal`** MCP for issues and PRs. The `gh` CLI is not available on this machine.

For larger initiatives, pair with [progress-tracking](../progress-tracking/SKILL.md) and [feature-docs](../feature-docs/SKILL.md).

---

## 1. Planning and Issues

**Small fix or single-file tweak:** branch and PR without an issue is fine.

**Features and multi-commit work:** create one GitHub issue in `pskillen/codeplug-tool` with:

- Problem and intended outcome
- Which part of the SPA is affected (e.g. a route/component under `src/`)
- Link to a Cursor plan if one exists
- For non-trivial scope: links to `docs/features/<topic>/` progress files

Start from a lightweight user request? Update the same issue with the agreed plan — do not create a duplicate.

---

## 2. Branch Naming

| Situation | Format | Example |
|-----------|--------|---------|
| Issue tracked | `{num}/{author}/{short-description}` | `12/paddy/zone-hull-colours` |
| No issue | `{type}/{short-description}` | `feat/channel-map`, `chore/repo-setup` |

Use kebab-case. Keep descriptions short.

Create branches from **`origin/main`** unless the work explicitly depends on another open branch.

---

## 3. Pre-commit Checks

The SPA has lint, format, and test tooling. Before committing, run the checks relevant to your change:

- `npm run lint` and `npm run format:check` — ESLint + Prettier
- `npm run test` — Vitest (`src/**/*.test.ts(x)`)
- `npm run build` — type-check and Vite production build when touching build/config
- `npm run dev` and exercise the affected route (e.g. `/#/map`) if behaviour changed
- Confirm no secrets (Mapbox tokens, personal CSVs) are staged
- Match existing patterns in the target component/module under `src/`

**Formatting:** `npm run format` writes fixes; `npm run format:check` is what CI runs. If `format:check` fails locally, run `npm run format`, review the diff, and commit the result — do not open a PR with unformatted files.

---

## 4. Commits

Use [conventional commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `chore`

**Scope:** tool slug when helpful — e.g. `channel-map`, `repo`

**Rules:**

- Atomic commits per logical change
- Brief but descriptive
- Do **not** use the word "enhance"

**Examples:**

```
feat(channel-map): draw zone hulls from Channels.csv coordinates
fix(channel-map): skip channels with Use Location disabled
docs(channel-map): add feature README and CSV column notes
chore(repo): add cursor skills for git workflow
```

---

## 5. Running git in Cursor agents

When the **Shell** tool runs `git`:

1. **Always set `working_directory`** to the repo root: `/Users/patricks/git_personal/opengd77-map`. Commands that only `cd` inside the command string often return empty output even on success.

2. **Good pattern**

   ```text
   working_directory: /Users/patricks/git_personal/opengd77-map
   command:            git fetch origin && git status -sb
   ```

3. **Permissions:** `required_permissions: ["git_write"]` for checkout/commit; add `"network"` for `fetch` / `push`.

4. **PRs and issues:** use `user-github-personal` MCP — not `gh`.

5. **Commits:**

   **Plan execution** (active `.cursor/plans/` file, user said "execute/continue the plan",
   or multi-slice work with commit checkpoints):
   - Commit at every **commit checkpoint** before starting the next slice.
   - Run `git status -sb` — working tree must be clean before the next slice.
   - Commit little and often; committing is not cheap to skip but cheap to do.
   - Docs are slices too — own checkpoint, own commit; not deferred to PR time.
   - **Forbidden:** batching many file edits then multiple `git commit` commands in one shell block.
   - After any conversation summary: `git log -5` and `git status -sb` — do not assume prior commits.

   **Ad-hoc conversation** (single question, review, unplanned tweak):
   - Do not commit unless the user asks.

---

## 6. Pull Requests

When work is ready:

1. Run `npm run format` and commit any Prettier fixes (CI runs `format:check`).
2. Run `npm run format:check && npm run lint && npm run test && npm run build`.
3. Push the branch.
4. Open one PR in `pskillen/codeplug-tool` via `user-github-personal` MCP
5. Link the issue (`Closes #N`) when applicable
6. Note which part of the SPA changed and how to smoke-test locally (`npm run dev`, affected route, or the GitHub Pages URL)

**PR description template:**

```markdown
## Summary
- …

## Test plan
- [ ] `npm run format:check && npm run lint && npm run test && npm run build`
- [ ] `npm run dev`, exercise the affected route (e.g. `/#/map` with sample Channels.csv / Zones.csv)
- [ ] …
```

---

## Quick Reference

| Step | Action |
|------|--------|
| Plan | Issue for non-trivial work; link plan + feature docs |
| Branch | `{num}/{author}/{slug}` or `{type}/{slug}` from `origin/main` |
| Pre-commit | `npm run format:check`, lint, test, build; dev-server smoke-test; no secrets in diff |
| Commit | Conventional commits; atomic; Shell `working_directory` = repo root |
| PR | `npm run format` first; then push; one PR; link issue; describe manual test steps |
| Deploy | Merge to `main`, then publish a full GitHub release (tag `v*`) → GitHub Pages |
