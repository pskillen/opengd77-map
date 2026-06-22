# Sample exports

Shared CPS export fixtures for manual import/export and map testing. Files here are **committed** so developers on different machines can use the same samples.

## Layout

Organise by vendor or export tool, for example:

- `OpenGD77 R2025.03.23.01/` — OpenGD77 CPS CSV sets (per-radio subfolders)
- `Baofeng DM32 CPS v1.60/` — DM32 CPS export
- `Chirp 2026-06-29/` — CHIRP CSV exports (analogue FM/AM)

Add new subfolders when a format needs shared test data. Keep samples suitable for the repo (no secrets; safe to share across the team).

## Private codeplugs

Use `local/` at the repo root (gitignored) for operator-specific exports you do not want in git.
