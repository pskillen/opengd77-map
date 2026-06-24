import type { Channel, Contact, RxGroupList, TalkGroup } from '../models/codeplug.ts';
import { getMemberWireNames } from './entityProvenance.ts';
import { entityRefsEqual } from './entityRefs.ts';

function locationsEqual(a: Channel['location'], b: Channel['location']): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.lat === b.lat && a.lon === b.lon;
}

function opengd77ExtrasEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
    if (a[keysA[i]] !== b[keysB[i]]) return false;
  }
  return true;
}

function channelContactImportEqual(a: Channel, b: Channel): boolean {
  const wireA = a.meta?.imported?.contactWireName;
  const wireB = b.meta?.imported?.contactWireName;
  if (wireA !== undefined || wireB !== undefined) {
    return (wireA ?? '') === (wireB ?? '');
  }
  return entityRefsEqual(a.contactRef, b.contactRef);
}

function channelRxListImportEqual(a: Channel, b: Channel): boolean {
  const wireA = a.meta?.imported?.rxGroupListWireName;
  const wireB = b.meta?.imported?.rxGroupListWireName;
  if (wireA !== undefined || wireB !== undefined) {
    return (wireA ?? '') === (wireB ?? '');
  }
  return a.rxGroupListId === b.rxGroupListId;
}

/** Compare import-mapped channel fields (excludes internal id and hideFromMap). */
export function channelsImportEqual(a: Channel, b: Channel): boolean {
  return (
    a.name === b.name &&
    a.callsign === b.callsign &&
    a.exportNameMode === b.exportNameMode &&
    a.mode === b.mode &&
    a.rxFrequency === b.rxFrequency &&
    a.txFrequency === b.txFrequency &&
    channelContactImportEqual(a, b) &&
    channelRxListImportEqual(a, b) &&
    locationsEqual(a.location, b.location) &&
    a.useLocation === b.useLocation &&
    a.bandwidthKHz === b.bandwidthKHz &&
    a.colourCode === b.colourCode &&
    a.timeslot === b.timeslot &&
    a.dmrId === b.dmrId &&
    a.rxTone === b.rxTone &&
    a.txTone === b.txTone &&
    a.squelch === b.squelch &&
    a.power === b.power &&
    a.forbidTransmit === b.forbidTransmit &&
    a.aprsConfigName === b.aprsConfigName &&
    a.voxEnabled === b.voxEnabled &&
    a.transmitTimeout === b.transmitTimeout &&
    a.scanSkip === b.scanSkip &&
    a.comment === b.comment &&
    opengd77ExtrasEqual(a.opengd77Extras, b.opengd77Extras)
  );
}

export function mergeChannelOntoExisting(existing: Channel, incoming: Channel): Channel {
  return {
    ...incoming,
    id: existing.id,
    hideFromMap: existing.hideFromMap,
  };
}

export function memberNamesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function contactsImportEqual(a: Contact, b: Contact): boolean {
  return (
    a.name === b.name &&
    a.identifier === b.identifier &&
    a.signalingMode === b.signalingMode &&
    (a.timeslotOverride ?? '') === (b.timeslotOverride ?? '')
  );
}

export function talkGroupsImportEqual(a: TalkGroup, b: TalkGroup): boolean {
  return a.name === b.name && a.number === b.number && a.timeslotOverride === b.timeslotOverride;
}

function rxGroupListMembersImportEqual(a: RxGroupList, b: RxGroupList): boolean {
  const wireA = getMemberWireNames(a);
  const wireB = getMemberWireNames(b);
  if (wireA.length > 0 || wireB.length > 0) {
    return memberNamesEqual(wireA, wireB);
  }
  if (a.memberRefs.length !== b.memberRefs.length) return false;
  return a.memberRefs.every((ref, i) => entityRefsEqual(ref, b.memberRefs[i]));
}

export function rxGroupListsImportEqual(a: RxGroupList, b: RxGroupList): boolean {
  return a.name === b.name && rxGroupListMembersImportEqual(a, b);
}

export function mergeContactOntoExisting(existing: Contact, incoming: Contact): Contact {
  return { ...incoming, id: existing.id };
}

export function mergeTalkGroupOntoExisting(existing: TalkGroup, incoming: TalkGroup): TalkGroup {
  return { ...incoming, id: existing.id };
}

export function mergeRxGroupListOntoExisting(
  existing: RxGroupList,
  incoming: RxGroupList,
): RxGroupList {
  return { ...incoming, id: existing.id };
}
