import { describe, expect, it } from 'vitest';
import { addRxGroupList, addTalkGroup, addZone } from '../../codeplugMutations.ts';
import { emptyCodeplug } from '../../../models/codeplug.ts';
import { buildChannel } from '../../../test/builders/index.ts';
import { buildRglMember } from '../../../test/builders/codeplug.ts';
import { collectOpenGd77ExportWarnings } from './warnings.ts';
import { DEFAULT_OPENGD77_PROFILE_ID } from '../../opengd77/profiles.ts';

describe('collectOpenGd77ExportWarnings', () => {
  it('warns when zone member count exceeds OpenGD77 profile cap', () => {
    const channels = Array.from({ length: 81 }, (_, i) =>
      buildChannel({ id: `ch-${i}`, name: `Ch${i}` }),
    );
    let cp = { ...emptyCodeplug(), channels };
    cp = addZone(cp, { name: 'Big', memberChannelIds: channels.map((ch) => ch.id) });

    const warnings = collectOpenGd77ExportWarnings(cp, { profileId: DEFAULT_OPENGD77_PROFILE_ID });
    expect(warnings.some((w) => /Big/.test(w) && /80/.test(w))).toBe(true);
  });

  it('warns when RX group list members exceed OpenGD77 profile cap', () => {
    let cp = emptyCodeplug();
    for (let i = 0; i < 40; i++) {
      cp = addTalkGroup(cp, { name: `TG${i}`, number: String(i) });
    }
    cp = addRxGroupList(cp, {
      name: 'BigList',
      memberRefs: cp.talkGroups.map((tg) => buildRglMember({ kind: 'talkGroup', id: tg.id })),
    });

    const warnings = collectOpenGd77ExportWarnings(cp, { profileId: DEFAULT_OPENGD77_PROFILE_ID });
    expect(warnings.some((w) => /BigList/.test(w) && /32/.test(w))).toBe(true);
  });
});
