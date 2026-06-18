# Display conventions

Shared rules for how values are shown in the UI.

## Frequencies (MHz)

Channel RX/TX frequencies are stored as strings (as imported from CPS CSV).

When displayed:

- **kHz-aligned** values (the MHz value rounds cleanly to 1 kHz) are shown with **three decimal places**, e.g. `145.775 MHz`.
- **Sub-kHz** values keep enough decimal places to preserve the stored value (at least three), e.g. `10.150250 MHz`.

Implementation: `formatFrequencyMhz()` in `src/lib/formatFrequency.ts`.

## Bands

UK amateur band pills use definitions in [bands.md](./bands.md). When RX and TX fall on different bands, show one pill per band (split operation).
