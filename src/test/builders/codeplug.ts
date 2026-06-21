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
    sourceMemberNames: [],
    ...overrides,
  };
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
  return {
    sourceMemberNames: [],
    ...overrides,
  };
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
