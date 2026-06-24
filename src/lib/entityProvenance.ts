export interface ImportedProvenance {
  formatId: string;
  sourceFile: string | null;
  importedAt: string;
  /** Ordered wire names for list members (zone→channel names; RGL→contact/tg names). Merge/delta only. */
  memberWireNames?: string[];
  /** Original Contact column at import — merge/delta only; export uses contactRef + mode rules. */
  contactWireName?: string;
  /** Original TG List column at import — merge/delta only; export uses rxGroupListId + mode rules. */
  rxGroupListWireName?: string;
  /** CHIRP Duplex/Offset wire at import — merge/delta only; export uses txFrequency and forbidTransmit. */
  chirpDuplexWire?: string;
  chirpOffsetWire?: string;
  /** Per-profile wire names after multi-mode import merge — merge/delta only. */
  multiModeProfileWire?: Array<{
    mode: string;
    contactWireName?: string;
    rxGroupListWireName?: string;
    opengd77Extras?: Record<string, string>;
  }>;
  /** Original Channel Name cell at import — re-import/merge identity only; export uses composeChannelWireName. */
  channelWireName?: string;
  /** All CPS wire names when import collapse merged multiple rows into one channel. */
  channelWireNames?: string[];
}

/** Remote repeater directory snapshot — verify/display only, not export source of truth. */
export interface RepeaterDirectoryProvenance {
  sourceId: 'ukrepeater';
  remoteListingId: number;
  fetchedAt: string;
  /** Opaque ETCC listing fields at fetch time — typed in ukrepeater module. */
  snapshot: Record<string, unknown>;
}

export interface EntityMeta {
  imported?: ImportedProvenance | null;
  repeaterDirectory?: RepeaterDirectoryProvenance | null;
}

export interface StampRepeaterDirectoryInput {
  sourceId: 'ukrepeater';
  remoteListingId: number;
  fetchedAt: string;
  snapshot: Record<string, unknown>;
}

export function stampRepeaterDirectory<T extends WithEntityMeta>(
  entity: T,
  input: StampRepeaterDirectoryInput,
): T {
  return {
    ...entity,
    meta: {
      ...entity.meta,
      repeaterDirectory: {
        sourceId: input.sourceId,
        remoteListingId: input.remoteListingId,
        fetchedAt: input.fetchedAt,
        snapshot: input.snapshot,
      },
    },
  };
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
  chirpDuplexWire?: string;
  chirpOffsetWire?: string;
  multiModeProfileWire?: ImportedProvenance['multiModeProfileWire'];
  channelWireName?: string;
  channelWireNames?: string[];
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
        ...(input.chirpDuplexWire !== undefined ? { chirpDuplexWire: input.chirpDuplexWire } : {}),
        ...(input.chirpOffsetWire !== undefined ? { chirpOffsetWire: input.chirpOffsetWire } : {}),
        ...(input.multiModeProfileWire !== undefined
          ? { multiModeProfileWire: input.multiModeProfileWire }
          : {}),
        ...(input.channelWireName !== undefined ? { channelWireName: input.channelWireName } : {}),
        ...(input.channelWireNames !== undefined
          ? { channelWireNames: input.channelWireNames }
          : {}),
      },
    },
  };
}
