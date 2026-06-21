import { describe, expect, it } from 'vitest';
import { buildChannel } from '../test/builders/index.ts';
import {
  channelHasLocation,
  channelOptionLabel,
  filterChannelOptions,
  resolveChannelOptionId,
} from './channelLookup.ts';

describe('channelLookup', () => {
  it('labels channel with callsign when different from name', () => {
    const ch = buildChannel({ id: '1', name: 'NoLoc Rpt', callsign: 'GB0NL' });
    expect(channelOptionLabel(ch)).toBe('NoLoc Rpt (GB0NL)');
  });

  it('filters channels by name or callsign', () => {
    const channels = [
      buildChannel({ id: '1', name: 'GB3HI', callsign: 'GB3HI' }),
      buildChannel({ id: '2', name: 'Other', callsign: 'GB0XX' }),
    ];
    expect(filterChannelOptions(channels, 'gb3')).toEqual([{ value: '1', label: 'GB3HI' }]);
  });

  it('detects channels without usable coordinates', () => {
    const withLoc = buildChannel({
      id: '1',
      name: 'A',
      location: { lat: 55.86, lon: -4.25 },
    });
    const withoutLoc = buildChannel({ id: '2', name: 'B', location: null });
    const zeroLoc = buildChannel({ id: '3', name: 'C', location: { lat: 0, lon: 0 } });

    expect(channelHasLocation(withLoc)).toBe(true);
    expect(channelHasLocation(withoutLoc)).toBe(false);
    expect(channelHasLocation(zeroLoc)).toBe(false);
  });

  it('resolves channel id from autocomplete label after Mantine sets display value', () => {
    const options = [
      { value: 'ch-1', label: 'GB3HI' },
      { value: 'ch-2', label: 'NoLoc Rpt (GB0NL)' },
    ];
    expect(resolveChannelOptionId('GB3HI', options)).toBe('ch-1');
    expect(resolveChannelOptionId('ch-1', options)).toBe('ch-1');
    expect(resolveChannelOptionId('partial', options)).toBeNull();
    expect(
      resolveChannelOptionId(
        'GB3HI',
        [],
        [buildChannel({ id: 'ch-1', name: 'GB3HI', callsign: 'GB3HI' })],
      ),
    ).toBe('ch-1');
  });
});
