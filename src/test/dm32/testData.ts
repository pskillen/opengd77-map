import { DEFAULT_DM32_PROFILE_ID } from '../../lib/dm32/profiles.ts';
import type { Dm32ExportFileName } from '../../lib/import/dm32/columns.ts';

export type Dm32TestDataFileName = Dm32ExportFileName;

export interface Dm32TestDataFixture {
  version: string;
  profileId: typeof DEFAULT_DM32_PROFILE_ID;
}

export const DM32_TEST_DATA_FIXTURES: readonly Dm32TestDataFixture[] = [
  {
    version: 'v1.60',
    profileId: DEFAULT_DM32_PROFILE_ID,
  },
] as const;

const DM32_TEST_DATA_MODULES = import.meta.glob('../../../test-data/baofeng-dm32/*/*.csv', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function fixtureModuleKey(fixture: Dm32TestDataFixture, fileName: Dm32TestDataFileName): string {
  return `../../../test-data/baofeng-dm32/${fixture.version}/${fileName}`;
}

export function readDm32TestData(
  fixture: Dm32TestDataFixture,
  fileName: Dm32TestDataFileName,
): string {
  const text = DM32_TEST_DATA_MODULES[fixtureModuleKey(fixture, fileName)];
  if (!text) {
    throw new Error(`Missing test-data fixture: ${fixtureModuleKey(fixture, fileName)}`);
  }
  return text;
}

export function dm32TestDataFiles(fixture: Dm32TestDataFixture): File[] {
  const inScope: Dm32TestDataFileName[] = [
    'Channels.csv',
    'Zones.csv',
    'Talkgroups.csv',
    'Contacts.csv',
    'RXGroupLists.csv',
    'DTMFContacts.csv',
  ];
  return inScope.map(
    (fileName) => new File([readDm32TestData(fixture, fileName)], fileName, { type: 'text/csv' }),
  );
}
