import {
  channelFieldDefaults,
  emptyCodeplug,
  type Channel,
  type ChannelMode,
  type Codeplug,
  type Contact,
  type RxGroupList,
  type TalkGroup,
  type Zone,
} from '../../models/codeplug.ts';
import { setMemberWireNames, stampImported } from '../../lib/entityProvenance.ts';

export function buildChannel(overrides: Partial<Channel> & Pick<Channel, 'id' | 'name'>): Channel {
  const { id, name, callsign, mode, ...rest } = overrides;
  return {
    id,
    name,
    callsign: callsign ?? name.split(/\s+/)[0],
    mode: mode ?? ('dmr' as ChannelMode),
    ...channelFieldDefaults(),
    ...rest,
  };
}

export function buildZone(overrides: Partial<Zone> & Pick<Zone, 'id' | 'name'>): Zone {
  return {
    memberChannelIds: [],
    ...overrides,
  };
}

/** Zone with member wire names in provenance (import/round-trip tests). */
export function buildImportedZone(
  overrides: Partial<Zone> & Pick<Zone, 'id' | 'name'>,
  memberWireNames: string[] = [],
): Zone {
  const zone = buildZone(overrides);
  if (memberWireNames.length === 0) return zone;
  return setMemberWireNames(
    stampImported(zone, {
      formatId: 'opengd77',
      sourceFile: 'Zones.csv',
      importedAt: new Date().toISOString(),
      memberWireNames,
    }),
    memberWireNames,
  );
}

export function buildTalkGroup(
  overrides: Partial<TalkGroup> & Pick<TalkGroup, 'id' | 'name'>,
): TalkGroup {
  return {
    number: '',
    timeslotOverride: '',
    ...overrides,
  };
}

export function buildContact(overrides: Partial<Contact> & Pick<Contact, 'id' | 'name'>): Contact {
  return {
    number: '',
    timeslotOverride: '',
    ...overrides,
  };
}

export function buildRxGroupList(
  overrides: Partial<RxGroupList> & Pick<RxGroupList, 'id' | 'name'>,
): RxGroupList {
  return { memberRefs: [], ...overrides };
}

/** RX group list with member wire names in provenance. */
export function buildImportedRxGroupList(
  overrides: Partial<RxGroupList> & Pick<RxGroupList, 'id' | 'name'>,
  memberWireNames: string[] = [],
): RxGroupList {
  const rgl = buildRxGroupList(overrides);
  if (memberWireNames.length === 0) return rgl;
  return setMemberWireNames(
    stampImported(rgl, {
      formatId: 'opengd77',
      sourceFile: 'TG_Lists.csv',
      importedAt: new Date().toISOString(),
      memberWireNames,
    }),
    memberWireNames,
  );
}

export function buildCodeplug(overrides: Partial<Codeplug> = {}): Codeplug {
  return {
    ...emptyCodeplug(),
    ...overrides,
  };
}

/** Channel with default geolocation for map/channel tests. */
export function buildGeolocatedChannel(
  overrides: Partial<Channel> & Pick<Channel, 'id' | 'name'>,
): Channel {
  return buildChannel({
    location: { lat: 56.5, lon: -4.0 },
    useLocation: true,
    ...overrides,
  });
}
