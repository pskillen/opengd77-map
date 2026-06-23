import { stripModeExportSuffix } from './channelExpansion/index.ts';
import type { Channel, ChannelExportNameMode } from '../models/codeplug.ts';
import { CALLSIGN_TOKEN_PATTERNS } from './channelNaming/patterns.ts';

export type { ChannelExportNameMode } from '../models/codeplug.ts';

export interface ParsedChannelWireName {
  callsign: string;
  name: string;
  exportNameMode: ChannelExportNameMode;
}

const EDGE_PUNCTUATION = /^[.,;:]+|[.,;:]+$/g;

export function normalizeCallsignToken(token: string): string {
  return token.trim().replace(EDGE_PUNCTUATION, '').toUpperCase();
}

export function isCallsignToken(token: string): boolean {
  const normalized = normalizeCallsignToken(token);
  if (!normalized || !/\d/.test(normalized)) return false;
  const base = normalized.split('/')[0];
  return CALLSIGN_TOKEN_PATTERNS.some((pattern) => pattern.regex.test(base));
}

export function tokenizeChannelWire(wire: string): string[] {
  return wire
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function prepareWireForCallsignParse(wire: string): string {
  return stripModeExportSuffix(wire.trim());
}

export function findCallsignTokenIndex(tokens: readonly string[]): number {
  for (let i = 0; i < tokens.length; i++) {
    if (isCallsignToken(tokens[i])) return i;
  }
  return -1;
}

export function parseChannelWireName(wire: string): ParsedChannelWireName {
  const prepared = prepareWireForCallsignParse(wire);
  const tokens = tokenizeChannelWire(prepared);
  const matchIndex = findCallsignTokenIndex(tokens);

  if (matchIndex < 0) {
    return {
      callsign: '',
      name: prepared,
      exportNameMode: 'name_only',
    };
  }

  const callsign = normalizeCallsignToken(tokens[matchIndex]);
  const nameTokens = [...tokens.slice(0, matchIndex), ...tokens.slice(matchIndex + 1)];
  return {
    callsign,
    name: nameTokens.join(' ').trim(),
    exportNameMode: 'callsign_name',
  };
}

export function composeChannelWireName(
  channel: Pick<Channel, 'callsign' | 'name' | 'exportNameMode'>,
): string {
  const callsign = channel.callsign.trim();
  const name = channel.name.trim();

  switch (channel.exportNameMode) {
    case 'callsign_name':
      if (callsign && name) return `${callsign} ${name}`;
      return callsign || name;
    case 'callsign_only':
      return callsign || name;
    case 'name_only':
      return name || callsign;
    case 'callsign_suffix': {
      const suffix = callsign.length >= 2 ? callsign.slice(-2).toUpperCase() : callsign.toUpperCase();
      if (suffix && name) return `${suffix} ${name}`;
      return suffix || name;
    }
    default:
      return name || callsign;
  }
}

export function splitLegacyCombinedName(fullName: string, callsign: string): string {
  const trimmed = fullName.trim();
  const cs = callsign.trim();
  if (!cs) return trimmed;
  if (trimmed.toUpperCase() === cs.toUpperCase()) return '';
  const prefix = new RegExp(`^${escapeRegExp(cs)}\\s+`, 'i');
  if (prefix.test(trimmed)) return trimmed.replace(prefix, '').trim();
  return trimmed;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Post-import pass: split wire name into callsign + qualifier; preserve channelWireName in meta. */
export function normalizeImportedChannelNaming(channels: Channel[]): Channel[] {
  return channels.map((channel) => {
    const wire = channel.meta?.imported?.channelWireName ?? channel.name;
    const parsed = parseChannelWireName(wire);
    return {
      ...channel,
      callsign: parsed.callsign,
      name: parsed.name,
      exportNameMode: parsed.exportNameMode,
    };
  });
}

/** Merge identity for active import — stashed wire name first. */
export function channelImportMergeKeys(channel: Channel): string[] {
  const keys: string[] = [];
  const imported = channel.meta?.imported;
  if (imported?.channelWireName) keys.push(imported.channelWireName);
  if (imported?.channelWireNames) keys.push(...imported.channelWireNames);
  const composed = composeChannelWireName(channel);
  if (composed && !keys.includes(composed)) keys.push(composed);
  return keys;
}

export function incomingChannelWireName(channel: Pick<Channel, 'name'>): string {
  return channel.name.trim();
}
