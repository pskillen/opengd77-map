import { chirpMinimalBundle, chirpTsqlBundle } from './bundles.ts';

const bundles = {
  minimal: chirpMinimalBundle,
  tsql: chirpTsqlBundle,
} as const;

export type ChirpFixtureName = keyof typeof bundles;

export function loadChirpFixture(name: ChirpFixtureName): File[] {
  const bundle = bundles[name];
  return Object.entries(bundle).map(
    ([fileName, content]) => new File([content], fileName, { type: 'text/csv' }),
  );
}
