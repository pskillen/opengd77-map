import type { FixtureBundle } from './bundles.ts';
import { filesFromBundle } from './bundles.ts';

export { filesFromBundle, filesFromBundleNames } from './bundles.ts';
export {
  minimalBundle,
  channelsOnlyBundle,
  zonesOnlyBundle,
  reducedChannelsBundle,
  modifiedChannelBundle,
  unresolvedZoneBundle,
} from './bundles.ts';

export function loadFixture(bundle: FixtureBundle): File[] {
  return filesFromBundle(bundle);
}
