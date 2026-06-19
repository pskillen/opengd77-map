import { CHANNEL_HEADERS, CONTACT_HEADERS, RX_GROUP_LIST_HEADERS } from '../../lib/import/opengd77/columns.ts';

/** Synthetic minimal OpenGD77 export for system tests. */
export const minimalBundle = {
  'Channels.csv': `${CHANNEL_HEADERS.join(',')}
1,GB3DA DMR,Digital,430.0,430.0,,2,1,Local 9,Scotland,,Off,Off,,,75%,Master,No,No,No,0,Off,No,No,None,56.5,-4.0,Yes
2,GB3BF FM,Analog,145.0,145.0,,,,,,,,Off,Off,,,75%,Master,No,No,No,0,Off,No,No,None,57.0,-3.5,Yes`,

  'Zones.csv': `Zone Name,Channel1,Channel2
North,GB3DA DMR,GB3BF FM`,

  'Contacts.csv': `${CONTACT_HEADERS.join(',')}
Local 9,9,Group,Disabled
Scotland TS1,2355,Group,1
MM9PDY,1234567,Private,Disabled`,

  'TG_Lists.csv': `${RX_GROUP_LIST_HEADERS.join(',')}
Scotland,Scotland TS1,Local 9,,`,
} as const;

export const channelsOnlyBundle = {
  'Channels.csv': minimalBundle['Channels.csv'],
} as const;

export const zonesOnlyBundle = {
  'Zones.csv': minimalBundle['Zones.csv'],
} as const;

export const reducedChannelsBundle = {
  'Channels.csv': `${CHANNEL_HEADERS.join(',')}
1,GB3DA DMR,Digital,430.0,430.0,,2,1,Local 9,Scotland,,Off,Off,,,75%,Master,No,No,No,0,Off,No,No,None,56.5,-4.0,Yes`,
} as const;

export const modifiedChannelBundle = {
  'Channels.csv': `${CHANNEL_HEADERS.join(',')}
1,GB3DA DMR,Digital,431.0,431.0,,2,1,Local 9,Scotland,,Off,Off,,,75%,Master,No,No,No,0,Off,No,No,None,56.5,-4.0,Yes
2,GB3BF FM,Analog,145.0,145.0,,,,,,,,Off,Off,,,75%,Master,No,No,No,0,Off,No,No,None,57.0,-3.5,Yes`,
} as const;

export const unresolvedZoneBundle = {
  'Zones.csv': `Zone Name,Channel1
Ghost,Missing Channel,`,
} as const;

export type FixtureBundle = Record<string, string>;

export function filesFromBundle(bundle: FixtureBundle): File[] {
  return Object.entries(bundle).map(
    ([name, content]) => new File([content], name, { type: 'text/csv' }),
  );
}

export function filesFromBundleNames(bundle: FixtureBundle, names: string[]): File[] {
  return names.map((name) => {
    const content = bundle[name];
    if (!content) throw new Error(`Fixture missing ${name}`);
    return new File([content], String(name), { type: 'text/csv' });
  });
}
