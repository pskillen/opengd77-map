import { describe, expect, it } from 'vitest';
import { composeChannelWireName } from '../channelNaming.ts';
import { buildChannel } from '../../test/builders/codeplug.ts';
import {
  disambiguationSuffixLength,
  finalizeWireName,
  shortenWireName,
  uniqueWireName,
} from './shortenName.ts';

describe('shortenWireName', () => {
  it('returns the name unchanged when within budget', () => {
    expect(shortenWireName('GB7GL', 16)).toBe('GB7GL');
  });

  it('abbreviates dictionary words progressively', () => {
    const name = 'GB7AC Largs Scotland West TS1';
    const shortened = shortenWireName(name, 16);
    expect(shortened.length).toBeLessThanOrEqual(16);
    expect(shortened).toContain('GB7AC');
  });

  it('replaces a trailing talk-group member suffix before dictionary steps', () => {
    const name = 'GB7AC Largs Scot West TS1';
    const shortened = shortenWireName(name, 20, {
      talkGroupMemberSuffix: { full: 'Scot West TS1', abbreviated: 'SW1' },
    });
    expect(shortened).toBe('GB7AC Largs SW1');
  });

  it('preserves mode export suffixes', () => {
    const shortened = shortenWireName('GB7GL Scotland-F', 10);
    expect(shortened.endsWith('-F')).toBe(true);
    expect(shortened.length).toBeLessThanOrEqual(10);
  });

  it('does not dictionary-abbreviate callsign or timeslot tokens', () => {
    const tokensOnly = shortenWireName('GB7AC Scotland TS1', 50, {
      useVowelSqueeze: false,
    });
    expect(tokensOnly).toMatch(/^GB7AC /);
    expect(tokensOnly).toContain('TS1');
    expect(tokensOnly).toContain('Scot');
  });

  it('applies vowel-squeeze on longest words when dictionary is insufficient', () => {
    const shortened = shortenWireName('GB7AC Largs Xylophone TS1', 16, {
      useDictionary: false,
    });
    expect(shortened.length).toBeLessThanOrEqual(16);
    expect(shortened).not.toContain('Xylophone');
  });

  it('downgrades callsign_name to callsign_suffix for this export only', () => {
    const channel = buildChannel({
      id: '1',
      name: 'Glasgow',
      callsign: 'GB7GL',
      exportNameMode: 'callsign_name',
    });
    const full = composeChannelWireName(channel);
    const shortened = shortenWireName(full, 12, {
      exportNameMode: 'callsign_name',
      useDictionary: false,
      useVowelSqueeze: false,
      recomposeWithMode: (mode) => composeChannelWireName({ ...channel, exportNameMode: mode }),
    });
    expect(shortened).toBe('GL Glasgow');
    expect(shortened.length).toBeLessThanOrEqual(12);
  });

  it('does not auto-downgrade when exportNameMode is not callsign_name', () => {
    const channel = buildChannel({
      id: '1',
      name: 'Glasgow',
      callsign: 'GB7GL',
      exportNameMode: 'callsign_only',
    });
    const full = composeChannelWireName(channel);
    const shortened = shortenWireName(full, 5, {
      exportNameMode: 'callsign_only',
      useDictionary: false,
      useVowelSqueeze: false,
      allowCallsignSuffixDowngrade: true,
      recomposeWithMode: (mode) => composeChannelWireName({ ...channel, exportNameMode: mode }),
    });
    expect(shortened).toBe('GB7GL'.slice(0, 5));
  });

  it('hard-truncates as a last resort', () => {
    const shortened = shortenWireName('GB7AC Largs Xylophone TS1', 11, {
      useDictionary: false,
      useVowelSqueeze: false,
      allowCallsignSuffixDowngrade: false,
    });
    expect(shortened).toBe('GB7AC Largs');
    expect(shortened.length).toBe(11);
  });

  it('fits tight 11- and 13-character radio limits', () => {
    const name = 'GB7AC Largs Scotland West TS1';
    for (const maxLen of [11, 13]) {
      const shortened = shortenWireName(name, maxLen);
      expect(shortened.length).toBeLessThanOrEqual(maxLen);
    }
  });
});

describe('uniqueWireName', () => {
  it('returns the base when not reserved', () => {
    expect(uniqueWireName('GB7GL', new Set())).toBe('GB7GL');
  });

  it('appends a numeric suffix on collision', () => {
    const reserved = new Set(['GB7GL', 'GB7GL 2']);
    expect(uniqueWireName('GB7GL', reserved)).toBe('GB7GL 3');
  });
});

describe('disambiguationSuffixLength', () => {
  it('returns zero when the base is free', () => {
    expect(disambiguationSuffixLength('GB7GL', new Set())).toBe(0);
  });

  it('returns the length of the suffix that would be added', () => {
    expect(disambiguationSuffixLength('GB7GL', new Set(['GB7GL']))).toBe(2);
    expect(disambiguationSuffixLength('GB7GL', new Set(['GB7GL', 'GB7GL 2']))).toBe(2);
  });
});

describe('finalizeWireName', () => {
  it('shortens and reserves a unique wire name', () => {
    const reserved = new Set<string>();
    const name = finalizeWireName('GB7AC Largs Scotland West TS1', reserved, 16);
    expect(name.length).toBeLessThanOrEqual(16);
    expect(reserved.has(name)).toBe(true);
  });

  it('leaves room for disambiguation suffixes within maxLen', () => {
    const reserved = new Set(['GB7AC Largs Sco W TS1']);
    const name = finalizeWireName('GB7AC Largs Scotland West TS1', reserved, 16);
    expect(name.length).toBeLessThanOrEqual(16);
    expect(name).not.toBe('GB7AC Largs Sco W TS1');
    expect(reserved.has(name)).toBe(true);
  });

  it('disambiguates with a numeric suffix after shortening', () => {
    const reserved = new Set<string>(['GB7GL']);
    const first = finalizeWireName('GB7GL Scotland', reserved, 16);
    const second = finalizeWireName('GB7GL Scotland', reserved, 16);
    expect(first.length).toBeLessThanOrEqual(16);
    expect(second).toBe(`${first} 2`.replace(/ 2 2$/, ' 2'));
    expect(second.endsWith(' 2')).toBe(true);
  });

  it('pushes a warning when still over maxLen after all strategies', () => {
    const warnings: string[] = [];
    const reserved = new Set<string>(['AB', 'A', 'A 2', 'A 3']);
    const name = finalizeWireName('AB', reserved, 2, {}, warnings);
    expect(name).toBe('A 4');
    expect(name.length).toBeGreaterThan(2);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('exceeds 2 characters');
  });
});
