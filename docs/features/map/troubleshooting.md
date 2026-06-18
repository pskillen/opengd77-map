# Map tool — console noise in development

Messages that appear in the browser devtools console while using the channel map. Use this to separate **app issues** from **environment noise**.

## From this app (actionable)

| Message | Cause | Mitigation in repo |
| --- | --- | --- |
| `Attempted to load an infinite number of tiles` | Leaflet `fitBounds` on a single point or zero-area bounds | Fixed — `src/lib/mapView.ts` uses `setView` for degenerate bounds |
| `Layout was forced before the page was fully loaded` (Firefox) | Leaflet measuring the map container before CSS is ready | Mitigated — Leaflet CSS loaded in `src/main.tsx`; map mounts after `window` `load`; `MapResizeFix` uses `ResizeObserver` |

If these persist after a hard refresh, file an issue with browser version and steps.

## Browser extensions (not from MM9PDY Codeplug Tool)

These stack frames point at extension scripts, not files under `src/`:

| Message | Typical source |
| --- | --- |
| `contentscript.js` … `fullScreen` / `InstallTrigger` / `onmozfullscreen*` deprecated | Extension content script (often password managers, ad blockers, or wallet extensions) |
| `ObjectMultiplex - orphaned data for stream "background-liveness"` | Extension messaging (e.g. MetaMask background script) |
| `ObjectMultiplex - malformed chunk without name` | Extension multiplex layer |
| `ObjectMultiplex - orphaned data for stream "metamask-multichain-provider"` | [MetaMask](https://metamask.io/) `inpage.js` / content script |
| `MaxListenersExceededWarning: … 11 close listeners` | Often **Vite dev server HMR** and/or **React StrictMode** double-mounting in development; can also appear when extensions attach many WebSocket listeners |

**How to confirm:** open the site in a private window with extensions disabled, or another browser profile without wallets installed. The extension messages should disappear; the app does not ship `contentscript.js` or `inpage.js`.

## Production builds

`npm run build` + `npm run preview` exercises the production bundle without Vite HMR. Extension noise may still appear if extensions are enabled.

## Related

- [map README](README.md) — feature overview
- [channels.md](channels.md) — channel layer behaviour
