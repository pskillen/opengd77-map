import { describe, expect, it } from 'vitest';
import { buildContact, buildTalkGroup } from '../test/builders/index.ts';
import {
  contactRefWireNameForExport,
  entityRefDisplayName,
  entityRefKey,
  memberRefsToWireNames,
  normaliseWireName,
  parseEntityRefKey,
  resolveContactRefByWireName,
  resolveMemberRefsByWireNames,
  resolveRxGroupListIdByName,
  rxGroupListWireNameForExport,
} from './entityRefs.ts';
import { buildCodeplug } from '../test/builders/index.ts';

describe('entityRefs', () => {
  const talkGroups = [
    buildTalkGroup({ id: 'tg-1', name: 'Scotland' }),
    buildTalkGroup({ id: 'tg-2', name: 'scotland' }),
  ];
  const contacts = [buildContact({ id: 'ct-1', name: 'MM9PDY' })];

  it('normaliseWireName treats None and empty as absent', () => {
    expect(normaliseWireName('')).toBe('');
    expect(normaliseWireName('None')).toBe('');
    expect(normaliseWireName('  Scotland  ')).toBe('Scotland');
  });

  it('resolveContactRefByWireName is case-sensitive and prefers talk group', () => {
    expect(resolveContactRefByWireName('Scotland', talkGroups, contacts)).toEqual({
      kind: 'talkGroup',
      id: 'tg-1',
    });
    expect(resolveContactRefByWireName('scotland', talkGroups, contacts)).toEqual({
      kind: 'talkGroup',
      id: 'tg-2',
    });
    expect(resolveContactRefByWireName('MM9PDY', talkGroups, contacts)).toEqual({
      kind: 'contact',
      id: 'ct-1',
    });
    expect(resolveContactRefByWireName('Missing', talkGroups, contacts)).toBeNull();
    expect(resolveContactRefByWireName('None', talkGroups, contacts)).toBeNull();
  });

  it('resolveMemberRefsByWireNames dedupes and reports unresolved', () => {
    const { memberRefs, unresolved } = resolveMemberRefsByWireNames(
      ['Scotland', 'MM9PDY', 'Scotland', 'Ghost'],
      talkGroups,
      contacts,
    );
    expect(memberRefs).toEqual([
      { kind: 'talkGroup', id: 'tg-1' },
      { kind: 'contact', id: 'ct-1' },
    ]);
    expect(unresolved).toEqual(['Ghost']);
  });

  it('entityRefKey round-trips via parseEntityRefKey', () => {
    const ref = { kind: 'contact' as const, id: 'ct-1' };
    expect(parseEntityRefKey(entityRefKey(ref))).toEqual(ref);
  });

  it('entityRefDisplayName resolves by id', () => {
    expect(entityRefDisplayName({ kind: 'talkGroup', id: 'tg-1' }, talkGroups, contacts)).toBe(
      'Scotland',
    );
    expect(entityRefDisplayName({ kind: 'contact', id: 'ct-1' }, talkGroups, contacts)).toBe(
      'MM9PDY',
    );
    expect(
      entityRefDisplayName({ kind: 'contact', id: 'missing' }, talkGroups, contacts),
    ).toBeNull();
  });

  it('memberRefsToWireNames preserves order', () => {
    expect(
      memberRefsToWireNames(
        [
          { kind: 'contact', id: 'ct-1' },
          { kind: 'talkGroup', id: 'tg-1' },
        ],
        talkGroups,
        contacts,
      ),
    ).toEqual(['MM9PDY', 'Scotland']);
  });

  it('resolveRxGroupListIdByName resolves list id', () => {
    const lists = [{ id: 'rgl-1', name: 'Scotland', memberRefs: [] }];
    expect(resolveRxGroupListIdByName('Scotland', lists)).toBe('rgl-1');
    expect(resolveRxGroupListIdByName('None', lists)).toBeNull();
  });

  it('contactRefWireNameForExport prefers provenance', () => {
    const codeplug = buildCodeplug({ talkGroups, contacts });
    expect(
      contactRefWireNameForExport(
        {
          contactRef: { kind: 'talkGroup', id: 'tg-1' },
          meta: {
            imported: {
              formatId: 'opengd77',
              sourceFile: null,
              importedAt: '',
              contactWireName: 'Wire TG',
            },
          },
        },
        codeplug,
      ),
    ).toBe('Wire TG');
    expect(
      contactRefWireNameForExport({ contactRef: { kind: 'talkGroup', id: 'tg-1' } }, codeplug),
    ).toBe('Scotland');
  });

  it('rxGroupListWireNameForExport prefers provenance', () => {
    const codeplug = buildCodeplug({
      rxGroupLists: [{ id: 'rgl-1', name: 'Scotland', memberRefs: [] }],
    });
    expect(
      rxGroupListWireNameForExport(
        {
          rxGroupListId: 'rgl-1',
          meta: {
            imported: {
              formatId: 'opengd77',
              sourceFile: null,
              importedAt: '',
              rxGroupListWireName: 'Wire RGL',
            },
          },
        },
        codeplug,
      ),
    ).toBe('Wire RGL');
    expect(rxGroupListWireNameForExport({ rxGroupListId: 'rgl-1' }, codeplug)).toBe('Scotland');
  });
});
