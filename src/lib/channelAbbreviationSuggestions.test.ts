import { describe, expect, it } from 'vitest';
import { channelAbbreviationSuggestions } from './channelAbbreviationSuggestions.ts';

describe('channelAbbreviationSuggestions', () => {
  it('returns empty for blank name', () => {
    expect(channelAbbreviationSuggestions('')).toEqual([]);
    expect(channelAbbreviationSuggestions('   ')).toEqual([]);
  });

  it('returns 6, 8, 10 and 12 char targets', () => {
    const suggestions = channelAbbreviationSuggestions('Largs Scotland West');
    expect(suggestions).toHaveLength(4);
    expect(suggestions.map((s) => s.maxLen)).toEqual([6, 8, 10, 12]);
    for (const { maxLen, text } of suggestions) {
      expect(text.length).toBeLessThanOrEqual(maxLen);
    }
  });
});
