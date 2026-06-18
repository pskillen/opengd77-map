# CRUD — progress

**Branch:** `11/paddy/channels-zones-crud`  
**Issues:** [#11](https://github.com/pskillen/codeplug-tool/issues/11), [#12](https://github.com/pskillen/codeplug-tool/issues/12)

## Status

| Slice | Status | Notes |
| --- | --- | --- |
| Docs scaffold | Complete | `docs/features/crud/`, `docs/reference/bands.md`, `docs/features/maidenhead.md` |
| Route migration | Complete | `src/routes/channels/`, `src/routes/zones/` |
| Store mutations | Complete | `src/lib/codeplugMutations.ts`, `codeplugStore` |
| Validation | Complete | `src/lib/validation/` |
| Channel CRUD UI | Complete | create/edit/delete, list filters, band pills |
| Zone CRUD UI | Complete | create/edit/delete, `ZoneMemberPicker` |
| #11 extras | Partial | bands, maidenhead, hideFromMap, filters, location pick — export prefix deferred |

## Verify

- `npm run lint && npm run test && npm run build`
- `npm run dev` → `/#/channels`, `/#/zones`
- Create/edit/delete channel and zone; check export round-trip

## Next

- Open PR closing #11 and #12
