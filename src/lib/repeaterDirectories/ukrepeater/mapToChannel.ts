import type { ChannelTone } from '../../channelFields/index.ts';
import { normalizeToneValue } from '../../channelFields/index.ts';
import type { ChannelInput } from '../../codeplugMutations.ts';
import { locatorToCoords } from '../../maidenhead.ts';
import {
  channelFieldDefaults,
  channelModeProfileDefaults,
  type EntityMeta,
} from '../../../models/codeplug.ts';
import type { EtccListing } from './types.ts';
import { listingToSnapshot } from './types.ts';
import { parseModeCodes, primaryModeFromCodes } from './modeCodes.ts';

export interface MapListingResult {
  input: ChannelInput;
  meta: EntityMeta;
  warnings: string[];
}

export interface MapListingSkip {
  reason: string;
  warnings: string[];
}

function ctcssToTone(ctcss: number): ChannelTone {
  if (!ctcss || ctcss === 0) return 'none';
  return normalizeToneValue(String(ctcss));
}

function buildComment(listing: EtccListing): string {
  const parts: string[] = [];
  if (listing.town?.trim()) parts.push(listing.town.trim());
  if (listing.status?.trim()) parts.push(listing.status.trim());
  return parts.join(' — ');
}

export function mapListingToChannelInput(
  listing: EtccListing,
  fetchedAt = new Date().toISOString(),
): MapListingResult | MapListingSkip {
  const parsed = parseModeCodes(listing.modeCodes ?? []);
  const warnings: string[] = [];

  if (!parsed.phase1Supported) {
    return {
      reason: 'No FM or DMR mode in listing',
      warnings: [`Unsupported modes: ${(listing.modeCodes ?? []).join(', ')}`],
    };
  }

  if (parsed.unsupportedFlags.length > 0) {
    warnings.push(`Other modes not mapped: ${parsed.unsupportedFlags.join(', ')}`);
  }

  const rxFrequency = listing.tx > 0 ? listing.tx : null;
  const txFrequency = listing.rx > 0 ? listing.rx : null;
  const tone = ctcssToTone(listing.ctcss);
  const bandwidthKHz = listing.txbw && listing.txbw > 0 ? listing.txbw : null;
  const coords = listing.locator ? locatorToCoords(listing.locator) : null;
  const location = coords ?? null;
  const useLocation = location != null;

  const shared = {
    rxFrequency,
    txFrequency,
    rxTone: tone,
    txTone: tone,
    bandwidthKHz,
    location,
    useLocation,
    comment: buildComment(listing),
  };

  let input: ChannelInput;

  if (parsed.hasAnalog && parsed.hasDmr) {
    const fmProfile = {
      ...channelModeProfileDefaults('fm'),
      bandwidthKHz: shared.bandwidthKHz,
      rxTone: shared.rxTone,
      txTone: shared.txTone,
    };
    const dmrProfile = {
      ...channelModeProfileDefaults('dmr'),
      bandwidthKHz: shared.bandwidthKHz,
      rxTone: shared.rxTone,
      txTone: shared.txTone,
      colourCode: parsed.colourCode,
    };
    input = {
      ...channelFieldDefaults(),
      callsign: listing.repeater,
      name: listing.town?.trim() ?? '',
      exportNameMode: 'callsign_name',
      mode: 'fm',
      multiMode: true,
      modeProfiles: [fmProfile, dmrProfile],
      colourCode: null,
      ...shared,
    };
  } else {
    const mode = primaryModeFromCodes(parsed);
    input = {
      ...channelFieldDefaults(),
      callsign: listing.repeater,
      name: listing.town?.trim() ?? '',
      exportNameMode: 'callsign_name',
      mode,
      multiMode: false,
      modeProfiles: [],
      colourCode: mode === 'dmr' ? parsed.colourCode : null,
      ...shared,
    };
  }

  const meta: EntityMeta = {
    repeaterDirectory: {
      sourceId: 'ukrepeater',
      remoteListingId: listing.id,
      fetchedAt,
      snapshot: listingToSnapshot(listing),
    },
  };

  return { input, meta, warnings };
}

export function isMapListingSkip(
  result: MapListingResult | MapListingSkip,
): result is MapListingSkip {
  return 'reason' in result;
}
