import { describe, expect, it } from 'vitest';
import { buildNameToChannelId, resolveZoneMembers } from './codeplug.ts';
import { channelFieldDefaults, type Channel } from '../models/codeplug.ts';

function ch(id: string, name: string): Channel {
  return {
    id,
    name,
    callsign: name.split(/\s+/)[0],
    mode: 'dmr',
    ...channelFieldDefaults(),
    location: { lat: 56.5, lon: -4.0 },
  };
}

describe('buildNameToChannelId', () => {
  it('is case-sensitive and first-wins', () => {
    const map = buildNameToChannelId([ch('a', 'Foo'), ch('b', 'foo'), ch('c', 'Foo')]);
    expect(map.get('Foo')).toBe('a');
    expect(map.get('foo')).toBe('b');
    expect(map.size).toBe(2);
  });
});

describe('resolveZoneMembers', () => {
  it('resolves ids and reports unresolved names', () => {
    const nameToId = buildNameToChannelId([ch('id-a', 'A'), ch('id-b', 'B')]);
    const { memberChannelIds, unresolved } = resolveZoneMembers(
      ['A', 'B', 'Missing', 'A'],
      nameToId,
    );
    expect(memberChannelIds).toEqual(['id-a', 'id-b']);
    expect(unresolved).toEqual(['Missing']);
  });
});
