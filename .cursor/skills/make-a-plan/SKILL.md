---
name: make-a-plan
description: >-
  Create a Cursor execution plan for codeplug-tool from GitHub issue numbers.
  Pulls tickets, clarifies scope, structures work with commit checkpoints and
  documentation updates. Use when the user asks to make a plan, plan work for
  ticket(s), or start planning from issue numbers.
---

# Make a plan (codeplug-tool)

Turn one or more GitHub issues into a **Cursor plan** an agent can execute.

Repo: `pskillen/codeplug-tool` (`/Users/patricks/git_personal/opengd77-map`). Use **`user-github-personal`** MCP for issues — not `gh`.

---

## 1. Gather context

### Pull the ticket(s)

When the user gives issue number(s) (e.g. `#42`, `42 and 55`):

1. For each issue, call `issue_read` (`method: get`, `owner: pskillen`, `repo: codeplug-tool`).
2. Read comments (`method: get_comments`) when the body is thin or there is recent discussion.
3. Check sub-issues (`method: get_sub_issues`) when the issue is an epic or parent.

Summarise for yourself: problem, intended outcome, affected SPA areas (`src/routes/`, `src/components/`, `src/lib/`, etc.), linked docs, and open questions.

### Explore the codebase

Read relevant source and docs before drafting the plan. Prefer existing patterns over inventing new ones.

Check for existing execution logs:

- `docs/features/<topic>/*-progress.md` and `*-outstanding.md`
- `docs/build/spa/*-progress.md` for SPA migration work
- Feature READMEs under `docs/features/<topic>/`
- Reference data under `docs/reference/`

### Clarify before planning

Use **AskQuestion** (or ask conversationally) when anything material is ambiguous:

- Scope boundaries (in vs out)
- Which route/component owns the change
- Whether behaviour is new or a fix to existing behaviour
- Dependencies on other open issues or branches
- Whether progress/outstanding files already exist or need creating

Do **not** produce a detailed plan until blockers are resolved or explicitly deferred with a note.

**If not running in plan mode** stop and ask for confirmation. If user insists we can continue to make a plan, but otherwise ask them to enable plan mode.

### Vendor-specific features and limits

Follow [Vendor boundaries](../../../AGENTS.md#vendor-boundaries) in [`AGENTS.md`](../../../AGENTS.md) for all work — not only when planning.

**When drafting a plan** for CRUD or model slices, include a short **vendor-neutral internal model** note in Context if the ticket touches DMR entities, channels, zones, or contacts. Call out:

- What stays unlimited / radio-agnostic in mutations and UI
- What the exporter may truncate or warn on (defer to export slice or existing serialise docs)
- Any shared **internal** FK rules that are not radio-specific (e.g. wire-name uniqueness because channels resolve contacts by name)

If a plan inherits pre-existing vendor leakage (e.g. zone member caps from an earlier slice), note it in **Out of scope** or **Outstanding** rather than copying the pattern into new code.

---

## 2. Plan structure

Use this template. Adapt sections to scope; omit what does not apply.

```markdown
# <Title> — plan

**Tracking:** [codeplug-tool#NNN](https://github.com/pskillen/codeplug-tool/issues/NNN)
**Branch:** `{num}/{author}/{short-slug}` (from [git-workflow](.cursor/skills/git-workflow/SKILL.md))

---

## Goal

<One paragraph: what done looks like for the operator/contributor.>

## Context

<Brief summary from issue(s) + codebase exploration. Link related docs. When work touches models, CRUD, or validation, note vendor-neutral boundaries per [AGENTS.md Vendor boundaries](../../../AGENTS.md#vendor-boundaries).>

## Progress tracking

<Only for non-trivial / multi-commit work — see section 3 below.>

## Approach

<Ordered phases or slices. Each slice = one logical unit of work.>

### Slice 1: <name>

- …
- **Commit checkpoint:** <when this slice is complete, commit before starting the next slice>

### Slice 2: <name>

- …
- **Commit checkpoint:** …

## Git workflow

<Required section — see section 4 below.>

## Documentation

<Required section — see section 5 below.>

## Test plan

- [ ] `npm run lint && npm run test`
- [ ] `npm run build` (when touching build/config/types)
- [ ] `npm run dev` — exercise affected route(s)
- [ ] …

## Out of scope

<Explicit deferrals to avoid scope creep.>
```

**Do not** include a pre-written list of commit messages or a commit log in the plan. Use **commit checkpoints** at the end of each slice instead.

---

## 3. Progress tracking (when to include)

Include a **Progress tracking** section when work is **non-trivial** (epic, new feature area, or spans more than one PR, or simply has gaps at the end).

Follow [progress-tracking](.cursor/skills/progress-tracking/SKILL.md):

```markdown
## Progress tracking

Read and update (per [progress-tracking](.cursor/skills/progress-tracking/SKILL.md)):

- **Progress:** [docs/features/<topic>/<slug>-progress.md](path)
- **Outstanding:** [docs/features/<topic>/<slug>-outstanding.md](path)

Create both at plan kickoff if missing. Update at each commit checkpoint and before opening a PR.
```

Skip progress files for single-commit fixes with no handoff risk.

---

## 4. Git workflow — mandatory plan section

Every plan **must** include a **Git workflow** section. Pull rules from [git-workflow](.cursor/skills/git-workflow/SKILL.md) and **insist on commit-as-you-go**.

Include this block (adapt branch name and checkpoints to the plan):

```markdown
## Git workflow

Follow [git-workflow](.cursor/skills/git-workflow/SKILL.md).

**Branch:** create `{num}/{author}/{short-slug}` from `origin/main` before the first code change.

### Commit as you go — non-negotiable

The executing agent **must commit at every commit checkpoint** in this plan **before moving to the next slice**. Do **not** batch all changes into one commit at the end. Do **not** defer commits until the PR.

At each checkpoint:

1. Run relevant pre-commit checks (`npm run lint`, `npm run test`, `npm run build` as appropriate).
2. Stage only files for the completed slice.
3. Create an **atomic conventional commit** (`feat`, `fix`, `docs`, etc.).
4. Update progress/outstanding docs if this initiative uses them.
5. Only then start the next slice.

If a checkpoint spans docs + code, prefer **two commits** (docs, then code) when they are logically separable.

**Shell:** set `working_directory` to `/Users/patricks/git_personal/opengd77-map` for all git commands.

**PR:** one PR in `pskillen/codeplug-tool` via `user-github-personal` MCP; link issue with `Closes #N`.
```

This section **overrides** the default “commit only when the user asks” rule — plans that include it require commits at checkpoints without waiting for the user to prompt.

---

## 5. Documentation — mandatory plan section

Every plan **must** call out documentation work. Use the right skill:

| Situation | Skill / action |
|-----------|----------------|
| New or changed feature behaviour | [feature-docs](.cursor/skills/feature-docs/SKILL.md) — update hub README, deep dives, `docs/features/README.md` index |
| Multi-step / multi-PR execution | [progress-tracking](.cursor/skills/progress-tracking/SKILL.md) — progress + outstanding pair |
| New shared component under `src/components/` | Add a **sidecar markdown** `<ComponentName>.md` in the same directory |

### Component sidecar pattern

When the plan introduces a new reusable component (e.g. `src/components/MyWidget/MyWidget.tsx`), add a slice:

- Create `MyWidget.md` alongside the component (see [CodeplugMap.md](../../../src/components/CodeplugMap/CodeplugMap.md) for shape).
- Cover: **Purpose**, **Props** (table), **Usage** (short TSX example), **Behaviour**, **Related** links.

Sidecars are for contributors and agents; feature docs under `docs/features/` remain the canonical product documentation.

### Documentation slice example

```markdown
### Slice N: Document <topic>

- Update `docs/features/<topic>/README.md` implementation status
- Add/update deep dive if behaviour is non-obvious
- **Commit checkpoint:** docs-only commit before or after the code slice it describes
```

---

## 6. Sizing and phasing

| Scope | Slices | Progress files | PRs |
|-------|--------|----------------|-----|
| Single-file fix | 1 | Skip | 1 |
| Small feature (2–4 files) | 2–3 with checkpoints | Optional | 1 |
| New feature area / migration | Phases with checkpoint per phase | Required | 1 per phase or one if small |

Each slice should be **completable and committable in one session**. If a slice feels too large, split it and add a checkpoint between sub-slices.

---

## 7. After the plan

1. **Link the plan** from the tracking issue (comment via `add_issue_comment` if the plan lives in `.cursor/plans/` or paste a summary).
2. Confirm branch name and first slice with the user if scope was uncertain.
3. When execution starts, the agent loads this plan **and** [git-workflow](.cursor/skills/git-workflow/SKILL.md); commits happen at checkpoints without further prompting.

---

## Anti-patterns

- Planning from issue title alone without reading the issue body and code.
- A “Commits” section listing predicted commit messages — use **commit checkpoints** instead.
- “Commit everything at the end before PR.”
- Copying the full plan todo list into `*-outstanding.md`.
- Skipping component sidecars for new shared components.
- Creating progress files for a one-line fix.
- Baking radio profile caps or target-radio constants into mutations, validation, or CRUD UI — see [AGENTS.md Vendor boundaries](../../../AGENTS.md#vendor-boundaries).
- Planning `OPENGD77_MAX_*` (or similar) constants for new internal-model work without an explicit export-only slice.
