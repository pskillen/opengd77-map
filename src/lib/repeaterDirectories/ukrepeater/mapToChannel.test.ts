import { describe, expect, it } from 'vitest';
import type { EtccListing } from './types.ts';
import { mapListingToChannelInput, isMapListingSkip } from './mapToChannel.ts';

const GB7DC: EtccListing = {
  id: 4763,
  type: 'DM',
  status: 'OPERATIONAL',
  keeperCallsign: 'G7NPW',
  town: 'DERBY',
  modeCodes: ['A', 'D', 'M:1', 'F', 'P', 'N'],
  tx: 439350000,
  rx: 430350000,
  repeater: 'GB7DC',
  ctcss: 71.9,
  txbw: 12.5,
  band: '70CM',
  locator: 'IO92',
  dbwErp: 14,
  extraDetails: { ngr: 'SK3837', antennaHeight: 0, polarisation: '' },
};

describe('mapListingToChannelInput', () => {
  it('inverts repeater tx/rx to channel rx/tx', () => {
    const result = mapListingToChannelInput(GB7DC);
    expect(isMapListingSkip(result)).toBe(false);
    if (isMapListingSkip(result)) return;
    expect(result.input.rxFrequency).toBe(439350000);
    expect(result.input.txFrequency).toBe(430350000);
  });

  it('creates multi-mode channel when A and M present', () => {
    const result = mapListingToChannelInput(GB7DC);
    if (isMapListingSkip(result)) throw new Error('unexpected skip');
    expect(result.input.multiMode).toBe(true);
    expect(result.input.modeProfiles).toHaveLength(2);
    expect(result.input.modeProfiles[1].colourCode).toBe(1);
  });

  it('maps tones and location', () => {
    const result = mapListingToChannelInput(GB7DC);
    if (isMapListingSkip(result)) throw new Error('unexpected skip');
    expect(result.input.rxTone).toBe('71.9');
    expect(result.input.useLocation).toBe(true);
    expect(result.input.location).not.toBeNull();
  });

  it('stamps repeaterDirectory provenance', () => {
    const result = mapListingToChannelInput(GB7DC);
    if (isMapListingSkip(result)) throw new Error('unexpected skip');
    expect(result.meta.repeaterDirectory?.remoteListingId).toBe(4763);
    expect(result.meta.repeaterDirectory?.sourceId).toBe('ukrepeater');
  });

  it('skips D-STAR-only listings', () => {
    const dstar: EtccListing = {
      ...GB7DC,
      modeCodes: ['D'],
    };
    const result = mapListingToChannelInput(dstar);
    expect(isMapListingSkip(result)).toBe(true);
  });

  it('title-cases town and comment when requested', () => {
    const result = mapListingToChannelInput(GB7DC, undefined, { titleCaseText: true });
    if (isMapListingSkip(result)) throw new Error('unexpected skip');
    expect(result.input.name).toBe('Derby');
    expect(result.input.comment).toBe('Derby — Operational');
    expect(result.input.callsign).toBe('GB7DC');
  });

  it('preserves dotted abbreviations when title-casing', () => {
    const niListing: EtccListing = { ...GB7DC, town: 'BELFAST N.I.' };
    const result = mapListingToChannelInput(niListing, undefined, { titleCaseText: true });
    if (isMapListingSkip(result)) throw new Error('unexpected skip');
    expect(result.input.name).toBe('Belfast N.I.');
    expect(result.input.comment).toBe('Belfast N.I. — Operational');
  });

  it('leaves ETCC casing when title case is off', () => {
    const result = mapListingToChannelInput(GB7DC);
    if (isMapListingSkip(result)) throw new Error('unexpected skip');
    expect(result.input.name).toBe('DERBY');
    expect(result.input.comment).toBe('DERBY — OPERATIONAL');
  });
});
