# CHIRP CSV import/export — outstanding

Items **skipped**, **incomplete**, or **discovered during execution** — not future plan phases.

**Tracking:** [codeplug-tool#103](https://github.com/pskillen/codeplug-tool/issues/103)

---

## Checklist gaps for Slice 7

From [adding-a-new-vendor.md](../adding-a-new-vendor.md) audit at kickoff:

- [ ] No `ImportAdapter` / `ExportAdapter` TypeScript interfaces — adapters are untyped `as const` objects
- [ ] `importFiles()` hardcodes `importAdapters[0]` — no format routing
- [ ] Export/import panels hardcode `id === 'opengd77'`
- [ ] `importMerge` stamps `formatId: 'opengd77'` regardless of source format
- [ ] `VendorFormatId` not shared between `vendorFormats.ts` and registries
- [ ] CHIRP absent from `vendorFormats.ts`
- [ ] adding-a-new-vendor §8 cross-format still "pattern only" — becomes real with CHIRP
- [ ] adding-a-new-vendor §9 assumes multi-file folder import — needs single-CSV CHIRP path
- [ ] `sample-exports/` described as gitignored in several docs — committed fixtures since #101
