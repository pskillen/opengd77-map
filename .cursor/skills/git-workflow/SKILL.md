---
name: git-workflow
description: >-
  Git workflow for opengd77-map — single monorepo of static browser tools on
  GitHub Pages. Plan with GitHub issues, branch by issue when tracked, use
  conventional commits, open PRs with linked tickets. Use when starting features,
  committing, or opening pull requests in this repo.
---

# opengd77-map Git Workflow

## Overview

This repo is a **small monorepo**: static HTML/JS tools, no build step, deployed from `main` via **GitHub Pages**. One issue, one branch, one PR — no cross-repo coordination.

Workflow: plan → issue (when non-trivial) → branch → commit → PR → merge to `main` (publishes to Pages).

Use the **`user-github-personal`** MCP for issues and PRs. The `gh` CLI is not available on this machine.

For larger initiatives, pair with [progress-tracking](../progress-tracking/SKILL.md) and [feature-docs](../feature-docs/SKILL.md).

---

## 1. Planning and Issues

**Small fix or single-file tweak:** branch and PR without an issue is fine.

**Features and multi-commit work:** create one GitHub issue in `pskillen/opengd77-map` with:

- Problem and intended outcome
- Which tool(s) are affected (HTML file name)
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

There is no formatter or test suite. Before committing:

- Open changed HTML in a browser if behaviour changed
- Confirm no secrets (Mapbox tokens, personal CSVs) are staged
- Match existing patterns in the target tool file

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

5. **Commits:** only when the user asks, unless a Cursor plan explicitly requires atomic commits during execution.

---

## 6. Pull Requests

When work is ready:

1. Open one PR in `pskillen/opengd77-map` via `user-github-personal` MCP
2. Link the issue (`Closes #N`) when applicable
3. Note which HTML tool(s) changed and how to smoke-test locally (open file or GitHub Pages preview URL)

**PR description template:**

```markdown
## Summary
- …

## Test plan
- [ ] Open `<tool>.html` locally with sample Channels.csv / Zones.csv
- [ ] …
```

---

## Quick Reference

| Step | Action |
|------|--------|
| Plan | Issue for non-trivial work; link plan + feature docs |
| Branch | `{num}/{author}/{slug}` or `{type}/{slug}` from `origin/main` |
| Pre-commit | Browser smoke-test; no secrets in diff |
| Commit | Conventional commits; atomic; Shell `working_directory` = repo root |
| PR | One PR in this repo; link issue; describe manual test steps |
| Deploy | Merge to `main` → GitHub Pages |
