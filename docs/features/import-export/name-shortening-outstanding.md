# Export name shortening — outstanding

Items **skipped**, **incomplete**, or **discovered during execution** — not the plan's future phases.

**Tracking:** [codeplug-tool#130](https://github.com/pskillen/codeplug-tool/issues/130)

---

## Dictionary / codegen

- [ ] Fresh clones must run `npm run generate:abbreviations` (or any `predev` / `pretest` / `prebuild` hook) before `dictionary.generated.ts` exists — consider a CI drift check if YAML edits land without regen
- [x] YAML parse error on `"Dumfries & Galloway"` — fixed spacing in source file
- [x] Duplicate `Emergency` key (`radio.general` vs `common.activity`) — removed from `common.activity`

## Workflow

- Mid-session edits to `abbreviations.yaml` need `npm run generate:abbreviations` and a dev-server reload (accepted)
