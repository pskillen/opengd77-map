import { shortenWireName } from './channelExpansion/shortenName.ts';

export interface ChannelAbbreviationSuggestion {
  maxLen: number;
  text: string;
}

const SUGGESTION_LENGTHS = [6, 8, 10, 12] as const;

/** Shorthand candidates for a channel name qualifier at common export length targets. */
export function channelAbbreviationSuggestions(name: string): ChannelAbbreviationSuggestion[] {
  const trimmed = name.trim();
  if (!trimmed) return [];
  return SUGGESTION_LENGTHS.map((maxLen) => ({
    maxLen,
    text: shortenWireName(trimmed, maxLen),
  }));
}
