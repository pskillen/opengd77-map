# Active import — progress

**Tracking:** [codeplug-tool#58](https://github.com/pskillen/codeplug-tool/issues/58)

## Shipped

- [x] `src/lib/importEntityCompare.ts` — import-field equality + merge onto existing
- [x] `src/lib/importMerge.ts` — merge/overwrite modes, preview, apply
- [x] Store wired through `applyImportToCodeplug` with `ImportApplyMode`
- [x] Unit tests in `src/lib/importMerge.test.ts`
- [x] `ImportIntoActivePanel` on Export page
- [x] System test suite + synthetic bundles (`npm run test:system`)
- [x] Feature docs update

## Verify before release

- [ ] Manual merge/overwrite workflow on `npm run dev`
- [ ] PR merged; `Closes #58`
