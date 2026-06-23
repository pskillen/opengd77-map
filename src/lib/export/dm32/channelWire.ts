import type { Channel } from '../../../models/codeplug.ts';
import { isAnalogMode, isDmrMode } from '../../channelModes.ts';
import {
  resolveChannelModeProfiles,
  type ExpandedChannelRow,
} from '../../channelExpansion/index.ts';
import { contactRefWireNameForExport, rxGroupListWireNameForExport } from '../../entityRefs.ts';
import type { Codeplug } from '../../../models/codeplug.ts';
import {
  formatDm32BandwidthWire,
  formatDm32ChannelTypeWire,
  formatDm32FlagWire,
  formatDm32FrequencyWire,
  formatDm32PowerWire,
  formatDm32SquelchWire,
  formatDm32TimeslotWire,
  formatDm32ToneWire,
} from '../../import/dm32/channelWire.ts';
import { CHANNEL_COL } from '../../import/dm32/columns.ts';
import { DEFAULT_DM32_PROFILE_ID, getDm32Profile } from '../../dm32/profiles.ts';

export function serialiseDm32ChannelRow(
  row: ExpandedChannelRow,
  sourceChannel: Channel,
  codeplug: Codeplug,
  profileId: string = DEFAULT_DM32_PROFILE_ID,
  rowNumber: number,
): Record<string, string> {
  const profile = getDm32Profile(profileId);
  const profiles = resolveChannelModeProfiles(sourceChannel);
  const fmProfile = profiles.find((p) => isAnalogMode(p.mode));
  const dmrProfile = profiles.find((p) => isDmrMode(p.mode));

  const nativeDual =
    sourceChannel.multiMode && profiles.length > 1 && row.wireName === sourceChannel.name;
  const channelType = nativeDual
    ? formatDm32ChannelTypeWire(sourceChannel.mode, true, profiles)
    : isDmrMode(row.mode)
      ? 'Digital'
      : 'Analog';

  const toneSource = nativeDual && fmProfile ? fmProfile : row;
  const dmrSource = nativeDual && dmrProfile ? dmrProfile : row;

  const aprsChannel =
    sourceChannel.aprsReportChannel ?? (isAnalogMode(row.mode) || nativeDual ? 256 : 1);

  return {
    [CHANNEL_COL.number]: String(rowNumber),
    [CHANNEL_COL.name]: row.wireName,
    [CHANNEL_COL.type]: channelType,
    [CHANNEL_COL.rx]: formatDm32FrequencyWire(row.rxFrequency),
    [CHANNEL_COL.tx]: formatDm32FrequencyWire(row.txFrequency),
    [CHANNEL_COL.power]: formatDm32PowerWire(row.power, profileId),
    [CHANNEL_COL.bandwidth]: formatDm32BandwidthWire(
      row.bandwidthKHz ?? sourceChannel.bandwidthKHz,
    ),
    [CHANNEL_COL.scanList]: 'None',
    [CHANNEL_COL.txAdmit]: sourceChannel.txAdmit || 'Channel Idle',
    [CHANNEL_COL.emergencySystem]: 'None',
    [CHANNEL_COL.squelch]: formatDm32SquelchWire(row.squelch ?? sourceChannel.squelch, profileId),
    [CHANNEL_COL.aprsReportType]: sourceChannel.aprsReportType || 'Off',
    [CHANNEL_COL.forbidTx]: formatDm32FlagWire(sourceChannel.forbidTransmit),
    [CHANNEL_COL.aprsReceive]: formatDm32FlagWire(sourceChannel.aprsReceiveEnabled),
    [CHANNEL_COL.forbidTalkaround]: formatDm32FlagWire(sourceChannel.forbidTalkaround),
    [CHANNEL_COL.autoScan]: '0',
    [CHANNEL_COL.loneWork]: '0',
    [CHANNEL_COL.emergencyIndicator]: '0',
    [CHANNEL_COL.emergencyAck]: '0',
    [CHANNEL_COL.analogAprsPtt]: '0',
    [CHANNEL_COL.digitalAprsPtt]: '0',
    [CHANNEL_COL.txContact]: (() => {
      const wire = contactRefWireNameForExport(
        { ...row, contactRef: row.contactRef ?? dmrSource.contactRef, mode: row.mode },
        codeplug,
      );
      return wire || 'None';
    })(),
    [CHANNEL_COL.rxGroupList]: (() => {
      const listId = row.rxGroupListId ?? dmrSource.rxGroupListId;
      if (!listId) return 'None';
      const wire = rxGroupListWireNameForExport(
        { ...row, rxGroupListId: listId, mode: row.mode },
        codeplug,
      );
      return wire || 'None';
    })(),
    [CHANNEL_COL.colourCode]: String(
      row.colourCode ?? dmrSource.colourCode ?? sourceChannel.colourCode ?? 0,
    ),
    [CHANNEL_COL.timeslot]: formatDm32TimeslotWire(
      isDmrMode(row.mode) || nativeDual ? dmrSource.timeslot : row.timeslot,
    ),
    [CHANNEL_COL.encryption]: '0',
    [CHANNEL_COL.encryptionId]: 'None',
    [CHANNEL_COL.aprsReportChannel]: String(aprsChannel),
    [CHANNEL_COL.directDualMode]: formatDm32FlagWire(sourceChannel.directDualMode),
    [CHANNEL_COL.privateConfirm]: '0',
    [CHANNEL_COL.shortDataConfirm]: '0',
    [CHANNEL_COL.dmrIdLabel]: profile.defaultDmrIdLabel,
    [CHANNEL_COL.rxTone]: formatDm32ToneWire(toneSource.rxTone),
    [CHANNEL_COL.txTone]: formatDm32ToneWire(toneSource.txTone),
    [CHANNEL_COL.scramble]: 'None',
    [CHANNEL_COL.rxSquelchMode]: 'Carrier/CTC',
    [CHANNEL_COL.signalingType]: 'None',
    [CHANNEL_COL.pttId]: 'OFF',
    [CHANNEL_COL.vox]: '0',
    [CHANNEL_COL.pttIdDisplay]: '0',
  };
}
