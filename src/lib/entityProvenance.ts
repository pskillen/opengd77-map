import type { Channel, Contact, RxGroupList, TalkGroup, Zone } from '../models/codeplug.ts';
import { memberRefsToWireNames } from './entityRefs.ts';

function channelNamesForIds(channels: Channel[], ids: string[]): string[] {
  const names: string[] = [];
  for (const id of ids) {
    const ch = channels.find((c) => c.id === id);
    if (ch) names.push(ch.name);
  }
  return names;
}

export interface ImportedProvenance {
  formatId: string;
  sourceFile: string | null;
  importedAt: string;
  /** Ordered wire names for list members (zone→channel names; RGL→contact/tg names). */
  memberWireNames?: string[];
  /** Original Contact column wire name (channels only). */
  contactWireName?: string;
  /** Original TG List column wire name (channels only). */
  rxGroupListWireName?: string;
}

export interface EntityMeta {
  imported?: ImportedProvenance | null;
}

export interface WithEntityMeta {
  meta?: EntityMeta;
}

export interface StampImportedInput {
  formatId: string;
  sourceFile: string | null;
  importedAt: string;
  memberWireNames?: string[];
  contactWireName?: string;
  rxGroupListWireName?: string;
}

export function getMemberWireNames(entity: WithEntityMeta): string[] {
  return entity.meta?.imported?.memberWireNames ?? [];
}

export function setMemberWireNames<T extends WithEntityMeta>(entity: T, names: string[]): T {
  const imported = entity.meta?.imported;
  if (!imported) {
    return {
      ...entity,
      meta: {
        imported: {
          formatId: 'opengd77',
          sourceFile: null,
          importedAt: new Date().toISOString(),
          memberWireNames: names,
        },
      },
    };
  }
  return {
    ...entity,
    meta: {
      ...entity.meta,
      imported: { ...imported, memberWireNames: names },
    },
  };
}

export function stampImported<T extends WithEntityMeta>(entity: T, input: StampImportedInput): T {
  return {
    ...entity,
    meta: {
      imported: {
        formatId: input.formatId,
        sourceFile: input.sourceFile,
        importedAt: input.importedAt,
        ...(input.memberWireNames !== undefined ? { memberWireNames: input.memberWireNames } : {}),
        ...(input.contactWireName !== undefined ? { contactWireName: input.contactWireName } : {}),
        ...(input.rxGroupListWireName !== undefined
          ? { rxGroupListWireName: input.rxGroupListWireName }
          : {}),
      },
    },
  };
}

/** Names for zone export — provenance wire names if present, else derive from member ids. */
export function zoneExportMemberNames(zone: Zone, channels: Channel[]): string[] {
  const wireNames = getMemberWireNames(zone);
  if (wireNames.length > 0) {
    return wireNames;
  }
  return channelNamesForIds(channels, zone.memberChannelIds);
}

/** Names for RX group list export — provenance wire names if present, else derive from memberRefs. */
export function rxGroupListExportMemberNames(
  rgl: RxGroupList,
  talkGroups: TalkGroup[],
  contacts: Contact[],
): string[] {
  const wireNames = getMemberWireNames(rgl);
  if (wireNames.length > 0) {
    return wireNames;
  }
  return memberRefsToWireNames(rgl.memberRefs, talkGroups, contacts);
}
