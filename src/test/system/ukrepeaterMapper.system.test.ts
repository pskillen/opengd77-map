import { describe, expect, it } from 'vitest';
import { buildChannel } from '../../test/builders/codeplug.ts';
import {
  diffChannelFromListing,
  diffHasChanges,
  mapListingToChannelInput,
  isMapListingSkip,
} from '../../lib/repeaterDirectories/registry.ts';
import type { EtccListing } from '../../lib/repeaterDirectories/ukrepeater/types.ts';

const GB7DC: EtccListing = {
  id: 4763,
  type: 'DM',
  status: 'OPERATIONAL',
  keeperCallsign: 'G7NPW',
  town: 'DERBY',
  modeCodes: ['A', 'M:1'],
  tx: 439350000,
  rx: 430350000,
  repeater: 'GB7DC',
  ctcss: 71.9,
  txbw: 12.5,
  band: '70CM',
  locator: 'IO92',
};

describe('ukrepeater mapper system', () => {
  it('maps listing to channel input and diffs against imported channel', () => {
    const mapped = mapListingToChannelInput(GB7DC);
    expect(isMapListingSkip(mapped)).toBe(false);
    if (isMapListingSkip(mapped)) return;

    const channel = buildChannel({
      id: 'c1',
      callsign: mapped.input.callsign,
      name: mapped.input.name,
      exportNameMode: mapped.input.exportNameMode,
      mode: 'fm',
      multiMode: true,
      modeProfiles: mapped.input.modeProfiles,
      rxFrequency: mapped.input.rxFrequency,
      txFrequency: mapped.input.txFrequency,
      rxTone: mapped.input.rxTone,
      txTone: mapped.input.txTone,
      bandwidthKHz: mapped.input.bandwidthKHz,
      location: mapped.input.location,
      useLocation: mapped.input.useLocation,
      comment: mapped.input.comment,
      meta: mapped.meta,
    });

    const diff = diffChannelFromListing(channel, GB7DC);
    expect(diffHasChanges(diff)).toBe(false);
  });

  it('detects drift when local frequencies differ', () => {
    const channel = buildChannel({
      id: 'c1',
      name: 'GB7DC',
      rxFrequency: 430000000,
      txFrequency: 430350000,
      mode: 'fm',
    });
    const diff = diffChannelFromListing(channel, GB7DC);
    expect(diffHasChanges(diff)).toBe(true);
  });
});
