import { formatFrequencyHz } from '../formatFrequency.ts';
import { modeLabel } from '../channelModes.ts';
import { resolveChannelModeProfiles } from '../channelExpansion/index.ts';
import type { Channel } from '../../models/codeplug.ts';
import type { ChannelInput } from '../codeplugMutations.ts';
import type { EtccListing } from './ukrepeater/types.ts';
import { mapListingToChannelInput, isMapListingSkip } from './ukrepeater/mapToChannel.ts';

export type ChannelDiffField =
  | 'callsign'
  | 'name'
  | 'rxFrequency'
  | 'txFrequency'
  | 'rxTone'
  | 'txTone'
  | 'bandwidthKHz'
  | 'colourCode'
  | 'mode'
  | 'location'
  | 'useLocation'
  | 'comment';

export interface ChannelDiffRow {
  field: ChannelDiffField;
  label: string;
  local: string;
  remote: string;
  changed: boolean;
}

const FIELD_LABELS: Record<ChannelDiffField, string> = {
  callsign: 'Callsign',
  name: 'Name',
  rxFrequency: 'RX frequency',
  txFrequency: 'TX frequency',
  rxTone: 'RX tone',
  txTone: 'TX tone',
  bandwidthKHz: 'Bandwidth',
  colourCode: 'Colour code',
  mode: 'Mode',
  location: 'Locator / coordinates',
  useLocation: 'Use location',
  comment: 'Comment',
};

function formatTone(tone: string): string {
  return tone === 'none' ? 'None' : tone;
}

function formatLocation(channel: Channel): string {
  if (!channel.location) return '—';
  const { lat, lon } = channel.location;
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function formatMode(channel: Channel): string {
  if (channel.multiMode) {
    return resolveChannelModeProfiles(channel)
      .map((p) => modeLabel(p.mode))
      .join(' + ');
  }
  return modeLabel(channel.mode);
}

function formatRemoteMode(input: ChannelInput): string {
  if (input.multiMode && input.modeProfiles.length > 0) {
    return input.modeProfiles.map((p) => modeLabel(p.mode)).join(' + ');
  }
  return modeLabel(input.mode);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  return false;
}

function locationEqual(a: Channel['location'], b: ChannelInput['location']): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lon - b.lon) < 0.0001;
}

export function diffChannelFromListing(channel: Channel, listing: EtccListing): ChannelDiffRow[] {
  const mapped = mapListingToChannelInput(listing);
  if (isMapListingSkip(mapped)) return [];

  const remote = mapped.input;
  const rows: ChannelDiffRow[] = [];

  const push = (field: ChannelDiffField, local: string, remoteVal: string, changed: boolean) => {
    rows.push({
      field,
      label: FIELD_LABELS[field],
      local,
      remote: remoteVal,
      changed,
    });
  };

  push('callsign', channel.callsign, remote.callsign, channel.callsign !== remote.callsign);
  push('name', channel.name, remote.name, channel.name !== remote.name);
  push(
    'rxFrequency',
    formatFrequencyHz(channel.rxFrequency) || '—',
    formatFrequencyHz(remote.rxFrequency) || '—',
    !valuesEqual(channel.rxFrequency, remote.rxFrequency),
  );
  push(
    'txFrequency',
    formatFrequencyHz(channel.txFrequency) || '—',
    formatFrequencyHz(remote.txFrequency) || '—',
    !valuesEqual(channel.txFrequency, remote.txFrequency),
  );
  push(
    'rxTone',
    formatTone(channel.rxTone),
    formatTone(remote.rxTone),
    channel.rxTone !== remote.rxTone,
  );
  push(
    'txTone',
    formatTone(channel.txTone),
    formatTone(remote.txTone),
    channel.txTone !== remote.txTone,
  );
  push(
    'bandwidthKHz',
    channel.bandwidthKHz != null ? `${channel.bandwidthKHz} kHz` : '—',
    remote.bandwidthKHz != null ? `${remote.bandwidthKHz} kHz` : '—',
    !valuesEqual(channel.bandwidthKHz, remote.bandwidthKHz),
  );

  const localCc = channel.multiMode
    ? (resolveChannelModeProfiles(channel).find((p) => p.mode === 'dmr')?.colourCode ?? null)
    : channel.colourCode;
  const remoteCc = remote.multiMode
    ? (remote.modeProfiles.find((p) => p.mode === 'dmr')?.colourCode ?? null)
    : remote.colourCode;
  push(
    'colourCode',
    localCc != null ? String(localCc) : '—',
    remoteCc != null ? String(remoteCc) : '—',
    !valuesEqual(localCc, remoteCc),
  );

  push(
    'mode',
    formatMode(channel),
    formatRemoteMode(remote),
    formatMode(channel) !== formatRemoteMode(remote),
  );
  push(
    'location',
    formatLocation(channel),
    formatLocation({ ...channel, location: remote.location }),
    !locationEqual(channel.location, remote.location),
  );
  push(
    'useLocation',
    channel.useLocation ? 'Yes' : 'No',
    remote.useLocation ? 'Yes' : 'No',
    channel.useLocation !== remote.useLocation,
  );
  push(
    'comment',
    channel.comment || '—',
    remote.comment || '—',
    channel.comment !== remote.comment,
  );

  return rows;
}

export function buildPatchFromDiff(
  _channel: Channel,
  listing: EtccListing,
  selectedFields: ChannelDiffField[],
): Partial<ChannelInput> {
  const mapped = mapListingToChannelInput(listing);
  if (isMapListingSkip(mapped)) return {};

  const remote = mapped.input;
  const patch: Partial<ChannelInput> = {};
  const selected = new Set(selectedFields);

  if (selected.has('callsign')) patch.callsign = remote.callsign;
  if (selected.has('name')) patch.name = remote.name;
  if (selected.has('rxFrequency')) patch.rxFrequency = remote.rxFrequency;
  if (selected.has('txFrequency')) patch.txFrequency = remote.txFrequency;
  if (selected.has('rxTone')) patch.rxTone = remote.rxTone;
  if (selected.has('txTone')) patch.txTone = remote.txTone;
  if (selected.has('bandwidthKHz')) patch.bandwidthKHz = remote.bandwidthKHz;
  if (selected.has('location')) patch.location = remote.location;
  if (selected.has('useLocation')) patch.useLocation = remote.useLocation;
  if (selected.has('comment')) patch.comment = remote.comment;

  if (selected.has('mode') || selected.has('colourCode')) {
    patch.mode = remote.mode;
    patch.multiMode = remote.multiMode;
    patch.modeProfiles = remote.modeProfiles;
    patch.colourCode = remote.colourCode;
  }

  return patch;
}

export function diffHasChanges(rows: ChannelDiffRow[]): boolean {
  return rows.some((r) => r.changed);
}
