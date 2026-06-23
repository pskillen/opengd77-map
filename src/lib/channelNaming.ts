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
  return wire.trim().split(/\s+/).filter(Boolean);
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
  const trimmed = wire.trim();
  const prepared = prepareWireForCallsignParse(trimmed);
  const tokens = tokenizeChannelWire(prepared);
  const matchIndex = findCallsignTokenIndex(tokens);

  if (matchIndex < 0) {
    return {
      callsign: '',
      name: trimmed,
      exportNameMode: 'name_only',
    };
  }

  const callsign = normalizeCallsignToken(tokens[matchIndex]);
  let name = [...tokens.slice(0, matchIndex), ...tokens.slice(matchIndex + 1)].join(' ').trim();
  if (name) {
    name = qualifyNameWithWireModeSuffix(trimmed, name);
  }
  return {
    callsign,
    name,
    exportNameMode: 'callsign_name',
  };
}

/** When CPS wire used a mode suffix on the qualifier, keep it on the internal name. */
function qualifyNameWithWireModeSuffix(trimmed: string, name: string): string {
  if (!trimmed.endsWith('-F') && !trimmed.endsWith('-D')) return name;
  const suffix = trimmed.slice(-2);
  return name.endsWith(suffix) ? name : `${name}${suffix}`;
}

export function composeChannelWireName(
  channel: Pick<Channel, 'callsign' | 'name' | 'exportNameMode'>,
): string {
  const callsign = (channel.callsign ?? '').trim();
  const name = (channel.name ?? '').trim();

  switch (channel.exportNameMode) {
    case 'callsign_name':
      if (callsign && name) return `${callsign} ${name}`;
      return callsign || name;
    case 'callsign_only':
      return callsign || name;
    case 'name_only':
      return name || callsign;
    case 'callsign_suffix': {
      const suffix =
        callsign.length >= 2 ? callsign.slice(-2).toUpperCase() : callsign.toUpperCase();
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
    let name = parsed.name;
    if (channel.multiMode && (name.endsWith('-F') || name.endsWith('-D'))) {
      name = stripModeExportSuffix(name);
    }
    return {
      ...channel,
      callsign: parsed.callsign,
      name,
      exportNameMode: parsed.exportNameMode,
    };
  });
}

/** Verbatim CPS Channel Name cell — from provenance or transient parse `name`. */
export function importedChannelWireCell(channel: Channel): string {
  return channel.meta?.imported?.channelWireName ?? channel.name;
}

/** After collapse merge: stash all source wire names for re-import identity. */
export function withMergedChannelWireProvenance(survivor: Channel, sources: Channel[]): Channel {
  const wireNames = [...new Set(sources.map(importedChannelWireCell).filter(Boolean))];
  if (wireNames.length === 0) return survivor;
  const imported = survivor.meta?.imported;
  if (!imported) return survivor;
  return {
    ...survivor,
    meta: {
      ...survivor.meta,
      imported: {
        ...imported,
        channelWireName: wireNames[0],
        ...(wireNames.length > 1 ? { channelWireNames: wireNames } : {}),
      },
    },
  };
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

export function incomingChannelMergeKey(channel: Channel): string {
  return channel.meta?.imported?.channelWireName ?? composeChannelWireName(channel);
}

export const EXPORT_NAME_MODE_OPTIONS: {
  value: ChannelExportNameMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'callsign_name',
    label: 'Callsign + name',
    description: 'GB7GL Glasgow',
  },
  {
    value: 'callsign_only',
    label: 'Callsign only',
    description: 'GB7GL',
  },
  {
    value: 'name_only',
    label: 'Name only',
    description: 'Glasgow',
  },
  {
    value: 'callsign_suffix',
    label: 'Callsign suffix + name',
    description: 'GL Glasgow',
  },
];

export function exportNameModeLabel(mode: ChannelExportNameMode): string {
  return EXPORT_NAME_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

/** Map popup / full-name label — qualifier parts only, not composed CPS wire string. */
export function channelDisplayLabel(
  channel: Pick<Channel, 'callsign' | 'name'>,
  useFull: boolean,
): string {
  if (!useFull) return channel.callsign.trim() || channel.name.trim();
  const callsign = channel.callsign.trim();
  const name = channel.name.trim();
  if (callsign && name) return `${callsign} — ${name}`;
  return callsign || name;
}
