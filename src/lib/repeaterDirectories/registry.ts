import type { RepeaterDirectorySource, RepeaterDirectorySourceId } from './types.ts';
import { searchUkRepeaters } from './ukrepeater/queryRouter.ts';
import { fetchByCallsign, fetchListingById } from './ukrepeater/client.ts';
import { toDirectoryListing as ukToDirectoryListing } from './ukrepeater/types.ts';
import { searchBrandMeisterDevices } from './brandmeister/queryRouter.ts';
import { fetchDeviceById } from './brandmeister/client.ts';
import { toDirectoryListing as bmToDirectoryListing } from './brandmeister/types.ts';

export const ukrepeaterSource: RepeaterDirectorySource = {
  id: 'ukrepeater',
  label: 'ukrepeater.net',

  async search(query: string) {
    const { listings } = await searchUkRepeaters(query, { operationalOnly: false });
    return listings.map(ukToDirectoryListing);
  },

  async fetchByCallsign(callsign: string) {
    const listings = await fetchByCallsign(callsign);
    return listings.map(ukToDirectoryListing);
  },

  async fetchByListingId(listingId: number) {
    const listing = await fetchListingById(listingId);
    return listing ? ukToDirectoryListing(listing) : null;
  },
};

export const brandmeisterSource: RepeaterDirectorySource = {
  id: 'brandmeister',
  label: 'BrandMeister',

  async search(query: string) {
    const { listings } = await searchBrandMeisterDevices(query);
    return listings;
  },

  async fetchByCallsign(callsign: string) {
    const { devices } = await searchBrandMeisterDevices(callsign);
    return devices.map(bmToDirectoryListing);
  },

  async fetchByListingId(listingId: number) {
    const device = await fetchDeviceById(listingId);
    return device ? bmToDirectoryListing(device) : null;
  },
};

const sources: RepeaterDirectorySource[] = [ukrepeaterSource, brandmeisterSource];

export function getRepeaterDirectorySource(id: RepeaterDirectorySourceId): RepeaterDirectorySource {
  const source = sources.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown repeater directory: ${id}`);
  return source;
}

export { searchUkRepeaters, filterListings, detectQueryKind } from './ukrepeater/queryRouter.ts';
export type {
  UkRepeaterSearchMode,
  QueryKind,
  ResolvedLocation,
} from './ukrepeater/queryRouter.ts';
export { mapListingToChannelInput, isMapListingSkip } from './ukrepeater/mapToChannel.ts';
export type {
  MapListingResult,
  MapListingSkip,
  MapListingOptions,
} from './ukrepeater/mapToChannel.ts';
export { diffChannelFromListing, buildPatchFromDiff, diffHasChanges } from './channelDiff.ts';
export type { ChannelDiffRow, ChannelDiffField } from './channelDiff.ts';
export { EtccDirectoryError, fetchByCallsign, fetchByKeeper, fetchListingById } from './ukrepeater/client.ts';
export type { EtccListing } from './ukrepeater/types.ts';
export {
  parseModeCodes,
  isOperationalStatus,
  formatModeCodesSummary,
} from './ukrepeater/modeCodes.ts';

export {
  searchBrandMeisterDevices,
  detectBrandMeisterQueryKind,
  looksLikeBrandMeisterCallsign,
} from './brandmeister/queryRouter.ts';
export {
  BrandMeisterDirectoryError,
  fetchDevicesByCallsign,
  fetchDeviceById,
  fetchStaticTalkgroups,
  fetchTalkgroupMeta,
} from './brandmeister/client.ts';
export type {
  BrandMeisterDevice,
  BrandMeisterStaticTalkgroup,
  BrandMeisterTalkgroupMeta,
} from './brandmeister/types.ts';
export { mhzStringToHz, parseMhz, deviceToSnapshot } from './brandmeister/types.ts';
export { mapDeviceToChannelInput, isMapDeviceSkip } from './brandmeister/mapToChannel.ts';
export type {
  MapDeviceResult,
  MapDeviceSkip,
  MapDeviceOptions,
} from './brandmeister/mapToChannel.ts';
export { matchDeviceForChannel } from './brandmeister/matchDevice.ts';
