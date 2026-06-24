import type { Channel, ChannelExportNameMode } from '../../../models/codeplug.ts';
import { channelPickForWireExport, composeChannelWireName } from '../../channelNaming.ts';
import { finalizeWireName } from '../../channelExpansion/shortenName.ts';
import {
  deriveChirpDuplexAndOffset,
  formatChirpFrequencyWire,
  formatChirpModeWire,
  formatChirpPowerWireForProfile,
  formatChirpScanSkip,
  formatChirpToneColumns,
  formatChirpTStepWire,
} from '../../import/chirp/channelWire.ts';

const DEFAULT_DTCS_CODE = '023';
const DEFAULT_DTCS_POLARITY = 'NN';
const DEFAULT_CROSS_MODE = 'Tone->Tone';

/**
 * CHIRP Duplex/Offset from model only — see docs/reference/chirp/channels.md (Duplex table).
 * Inverse of import parseChirpDuplex: rxFrequency, txFrequency, forbidTransmit → wire duplex + offset.
 */
function chirpDuplexAndOffset(channel: Channel): { duplex: string; offsetMhz: number } {
  return deriveChirpDuplexAndOffset(channel.rxFrequency, channel.txFrequency, channel.forbidTransmit);
}

export interface ChirpChannelWireOptions {
  reserved: Set<string>;
  maxNameLength: number;
  shortenNames: boolean;
  nameModeOverride?: ChannelExportNameMode;
  useChannelAbbreviation?: boolean;
  warnings?: string[];
}

function channelWireName(channel: Channel, options: ChirpChannelWireOptions): string {
  const ch = channelPickForWireExport(channel, {
    nameModeOverride: options.nameModeOverride,
    useChannelAbbreviation: options.useChannelAbbreviation,
  });
  const base = composeChannelWireName(ch);
  if (!options.shortenNames) {
    if (base.length > options.maxNameLength) {
      options.warnings?.push(`Channel name "${base}" exceeds ${options.maxNameLength} characters`);
    }
    return base;
  }
  return finalizeWireName(
    base,
    options.reserved,
    options.maxNameLength,
    {
      exportNameMode: ch.exportNameMode,
      recomposeWithMode: (mode) => composeChannelWireName({ ...ch, exportNameMode: mode }),
    },
    options.warnings,
  );
}

/** Map one internal channel to a CHIRP CSV row (header order). */
export function channelToChirpRow(
  channel: Channel,
  location: number,
  profileId: string,
  wireOptions: ChirpChannelWireOptions,
): string[] {
  const { duplex, offsetMhz } = chirpDuplexAndOffset(channel);
  const tones = formatChirpToneColumns(channel.rxTone, channel.txTone);

  return [
    String(location),
    channelWireName(channel, wireOptions),
    formatChirpFrequencyWire(channel.rxFrequency),
    duplex,
    offsetMhz.toFixed(6),
    tones.tone,
    tones.rToneFreq,
    tones.cToneFreq,
    DEFAULT_DTCS_CODE,
    DEFAULT_DTCS_POLARITY,
    DEFAULT_DTCS_CODE,
    DEFAULT_CROSS_MODE,
    formatChirpModeWire(channel.mode, channel.bandwidthKHz),
    formatChirpTStepWire(),
    formatChirpScanSkip(channel.scanSkip),
    formatChirpPowerWireForProfile(channel.power, profileId),
    '',
    '',
    '',
    '',
    '',
  ];
}
