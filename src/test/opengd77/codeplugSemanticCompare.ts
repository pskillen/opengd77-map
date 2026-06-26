import type { EntityMeta, ImportedProvenance } from '../../lib/entityProvenance.ts';
import { canonicalOpenGd77ChannelWireForCompare } from '../../lib/channelExpansion/index.ts';
import { entityRefDisplayName } from '../../lib/entityRefs.ts';
import type { Codeplug } from '../../models/codeplug.ts';

function withoutId<T extends { id: string; meta?: EntityMeta }>(item: T): Omit<T, 'id'> {
  const copy = { ...item };
  delete (copy as { id?: string }).id;
  if (copy.meta?.imported) {
    copy.meta = {
      ...copy.meta,
      imported: { ...copy.meta.imported, importedAt: 'stripped' },
    };
  }
  return copy as Omit<T, 'id'>;
}

function stripImportedWireProvenance(
  imported: ImportedProvenance,
): Pick<ImportedProvenance, 'formatId' | 'sourceFile'> & { importedAt: string } {
  return {
    formatId: imported.formatId,
    sourceFile: imported.sourceFile,
    importedAt: 'stripped',
  };
}

function withoutZoneIds(zone: Codeplug['zones'][number]) {
  const copy = withoutId(zone) as Codeplug['zones'][number];
  delete (copy as { memberChannelIds?: string[] }).memberChannelIds;
  if (copy.meta?.imported) {
    copy.meta = { ...copy.meta, imported: stripImportedWireProvenance(copy.meta.imported) };
  }
  return copy;
}

/** Strip non-semantic fields for Tier-3 semantic round-trip compares. */
export function stripCodeplugForSemanticCompare(cp: Codeplug) {
  const rxListName = (id: string | null) => {
    if (!id) return null;
    return cp.rxGroupLists.find((r) => r.id === id)?.name ?? null;
  };

  return {
    meta: { ...cp.meta, importedAt: null, sourceFiles: [] },
    channels: cp.channels
      .map((ch) => {
        const copy = withoutId(ch) as Codeplug['channels'][number];
        copy.name = canonicalOpenGd77ChannelWireForCompare(copy.name);
        if (copy.contactRef) {
          const name = entityRefDisplayName(copy.contactRef, cp.talkGroups, cp.contacts);
          copy.contactRef = name ? { kind: copy.contactRef.kind, id: name } : null;
        }
        copy.rxGroupListId = rxListName(copy.rxGroupListId);
        if (copy.modeProfiles.length > 0) {
          copy.modeProfiles = copy.modeProfiles.map((profile) => ({
            ...profile,
            contactRef: profile.contactRef
              ? {
                  kind: profile.contactRef.kind,
                  id:
                    entityRefDisplayName(profile.contactRef, cp.talkGroups, cp.contacts) ??
                    profile.contactRef.id,
                }
              : null,
            rxGroupListId: rxListName(profile.rxGroupListId),
          }));
        }
        if (copy.meta?.imported) {
          copy.meta = {
            ...copy.meta,
            imported: stripImportedWireProvenance(copy.meta.imported),
          };
        }
        return copy;
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    zones: cp.zones.map(withoutZoneIds).sort((a, b) => a.name.localeCompare(b.name)),
    talkGroups: cp.talkGroups.map(withoutId).sort((a, b) => a.name.localeCompare(b.name)),
    rxGroupLists: cp.rxGroupLists
      .map((rgl) => {
        const copy = withoutId(rgl) as Codeplug['rxGroupLists'][number];
        copy.memberRefs = rgl.memberRefs
          .map((member) => ({
            ref: {
              kind: member.ref.kind,
              id:
                member.ref.kind === 'talkGroup'
                  ? (cp.talkGroups.find((tg) => tg.id === member.ref.id)?.name ?? member.ref.id)
                  : (cp.contacts.find((c) => c.id === member.ref.id)?.name ?? member.ref.id),
            },
            ...(member.timeslot != null ? { timeslot: member.timeslot } : {}),
          }))
          .sort((a, b) => {
            const nameCmp = a.ref.id.localeCompare(b.ref.id);
            if (nameCmp !== 0) return nameCmp;
            return (a.timeslot ?? 0) - (b.timeslot ?? 0);
          });
        if (copy.meta?.imported) {
          copy.meta = {
            ...copy.meta,
            imported: stripImportedWireProvenance(copy.meta.imported),
          };
        }
        return copy;
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    contacts: cp.contacts.map(withoutId),
  };
}
