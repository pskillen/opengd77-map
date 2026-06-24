import type { RepeaterDirectorySource } from './types.ts';
import { searchUkRepeaters } from './ukrepeater/queryRouter.ts';
import { fetchByCallsign, fetchListingById } from './ukrepeater/client.ts';
import { toDirectoryListing } from './ukrepeater/types.ts';

export const ukrepeaterSource: RepeaterDirectorySource = {
  id: 'ukrepeater',
  label: 'ukrepeater.net',

  async search(query: string) {
    const { listings } = await searchUkRepeaters(query, { operationalOnly: false });
    return listings.map(toDirectoryListing);
  },

  async fetchByCallsign(callsign: string) {
    const listings = await fetchByCallsign(callsign);
    return listings.map(toDirectoryListing);
  },

  async fetchByListingId(listingId: number) {
    const listing = await fetchListingById(listingId);
    return listing ? toDirectoryListing(listing) : null;
  },
};

const sources: RepeaterDirectorySource[] = [ukrepeaterSource];

export function getRepeaterDirectorySource(id: 'ukrepeater'): RepeaterDirectorySource {
  const source = sources.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown repeater directory: ${id}`);
  return source;
}

export { searchUkRepeaters, filterListings, detectQueryKind } from './ukrepeater/queryRouter.ts';
export { mapListingToChannelInput, isMapListingSkip } from './ukrepeater/mapToChannel.ts';
export type {
  MapListingResult,
  MapListingSkip,
  MapListingOptions,
} from './ukrepeater/mapToChannel.ts';
export { diffChannelFromListing, buildPatchFromDiff, diffHasChanges } from './channelDiff.ts';
export type { ChannelDiffRow, ChannelDiffField } from './channelDiff.ts';
export { EtccDirectoryError, fetchByCallsign, fetchListingById } from './ukrepeater/client.ts';
export type { EtccListing } from './ukrepeater/types.ts';
export {
  parseModeCodes,
  isOperationalStatus,
  formatModeCodesSummary,
} from './ukrepeater/modeCodes.ts';
