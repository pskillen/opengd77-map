import { describe, expect, it } from 'vitest';
import { channelListColumnsKey, channelListPrefsKey, entityListPrefsKey } from './keys.ts';
import { loadChannelListPrefs, mergeChannelListPrefs, saveChannelListPrefs } from './storage.ts';
import {
  channelListPrefsFromSearchParams,
  channelListPrefsToSearchParams,
  hasChannelListUrlParams,
  hasEntityListUrlParams,
} from './urlSync.ts';

describe('listPrefs keys', () => {
  it('builds per-project keys under app prefix', () => {
    expect(channelListPrefsKey('proj-1')).toBe('mm9pdy-codeplug-tool.list.channels.proj-1');
    expect(entityListPrefsKey('zones', 'proj-1')).toBe('mm9pdy-codeplug-tool.list.zones.proj-1');
    expect(channelListColumnsKey('proj-1')).toBe(
      'mm9pdy-codeplug-tool.list.channels.proj-1.columns',
    );
  });

  it('isolates prefs by project id', () => {
    saveChannelListPrefs('proj-a', { q: 'alpha' });
    saveChannelListPrefs('proj-b', { q: 'beta' });
    expect(loadChannelListPrefs('proj-a')?.q).toBe('alpha');
    expect(loadChannelListPrefs('proj-b')?.q).toBe('beta');
    localStorage.removeItem(channelListPrefsKey('proj-a'));
    localStorage.removeItem(channelListPrefsKey('proj-b'));
  });
});

describe('channelListPrefs urlSync', () => {
  it('detects when URL has list params', () => {
    expect(hasChannelListUrlParams(new URLSearchParams())).toBe(false);
    expect(hasChannelListUrlParams(new URLSearchParams('q=test'))).toBe(true);
    expect(hasChannelListUrlParams(new URLSearchParams('band=2m'))).toBe(true);
    expect(hasEntityListUrlParams(new URLSearchParams())).toBe(false);
    expect(hasEntityListUrlParams(new URLSearchParams('q=x'))).toBe(true);
  });

  it('round-trips filter params between URL and prefs', () => {
    const params = new URLSearchParams(
      'q=gb3le&sort=distance&band=2m,70cm&mode=DMR&duplex=simplex&distance=1&maxKm=50',
    );
    const prefs = channelListPrefsFromSearchParams(params);
    expect(prefs).toEqual({
      q: 'gb3le',
      sortMode: 'distance',
      band: ['2m', '70cm'],
      mode: ['DMR'],
      duplex: 'simplex',
      distanceFilterEnabled: true,
      maxDistanceKm: 50,
    });

    const back = channelListPrefsToSearchParams(prefs);
    expect(back.get('q')).toBe('gb3le');
    expect(back.get('sort')).toBe('distance');
    expect(back.get('band')).toBe('2m,70cm');
    expect(back.get('mode')).toBe('DMR');
    expect(back.get('duplex')).toBe('simplex');
    expect(back.get('distance')).toBe('1');
    expect(back.get('maxKm')).toBe('50');
  });

  it('omits default values from URL params', () => {
    const params = channelListPrefsToSearchParams({ q: '', sortMode: 'name' });
    expect(params.toString()).toBe('');
  });
});

describe('mergeChannelListPrefs', () => {
  it('merges partial updates', () => {
    const key = channelListPrefsKey('merge-test');
    localStorage.removeItem(key);
    mergeChannelListPrefs('merge-test', { q: 'first' });
    mergeChannelListPrefs('merge-test', { sortMode: 'distance' });
    expect(loadChannelListPrefs('merge-test')).toEqual({ q: 'first', sortMode: 'distance' });
    localStorage.removeItem(key);
  });
});
