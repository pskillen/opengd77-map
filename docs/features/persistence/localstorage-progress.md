# LocalStorage persistence — progress

**Branch:** `9/paddy/localstorage-persistence`  
**Tracking:** [codeplug-tool#9](https://github.com/pskillen/codeplug-tool/issues/9)

## Shipped

- [x] `src/state/codeplugStorage.ts` — projects envelope v1, load/save/clear, validation, quota error
- [x] Store hydrate + auto-save in `CodeplugProvider`
- [x] `persistenceError` surfaced in `ImportDropzone` (home + map)
- [x] Tests in `codeplugStorage.test.ts` and `codeplugStore.test.tsx`

## Verify

- `npm run lint && npm run test && npm run build`
- Manual reload + multi-project smoke test (see [README](README.md))

## Next

- Open PR; link `Closes #9`
- [#32](https://github.com/pskillen/codeplug-tool/issues/32) if LocalStorage quota becomes a real constraint
