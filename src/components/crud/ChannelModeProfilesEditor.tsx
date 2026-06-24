import { Group, NumberInput, Select, Stack, Tabs, Text } from '@mantine/core';
import ModePill from './ModePill.tsx';
import { PercentLevelSlider } from '../ui/index.ts';
import {
  BANDWIDTH_KHZ_OPTIONS,
  toneSelectOptions,
  type ChannelTimeslot,
  type ChannelTone,
} from '../../lib/channelFields/index.ts';
import { isAnalogMode, isDmrMode, modeLabel, type ChannelMode } from '../../lib/channelModes.ts';
import type { ChannelModeProfile } from '../../models/codeplug.ts';
import { channelModeProfileDefaults } from '../../models/codeplug.ts';
import { entityRefKey, parseEntityRefKey } from '../../lib/entityRefs.ts';
import type { Codeplug } from '../../models/codeplug.ts';

export type ModeProfileFormValues = {
  mode: ChannelMode;
  bandwidthKHz: string;
  colourCode: string;
  timeslot: string;
  contactRefKey: string;
  rxGroupListId: string;
  dmrId: string;
  rxTone: ChannelTone;
  txTone: ChannelTone;
  squelch: number | null;
};

const bandwidthSelectData = [
  { value: '', label: '—' },
  ...BANDWIDTH_KHZ_OPTIONS.map((bw) => ({ value: String(bw), label: `${bw} kHz` })),
];

const timeslotSelectData = [
  { value: '', label: '—' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
];

export function formProfileToModel(form: ModeProfileFormValues): ChannelModeProfile {
  const colourCode = form.colourCode.trim() ? parseInt(form.colourCode, 10) : null;
  const timeslotRaw = form.timeslot.trim();
  const timeslot: ChannelTimeslot | null = timeslotRaw === '1' ? 1 : timeslotRaw === '2' ? 2 : null;
  const dmrId = form.dmrId.trim() ? parseInt(form.dmrId, 10) : null;
  const bandwidth = form.bandwidthKHz.trim() ? parseFloat(form.bandwidthKHz) : null;

  return {
    mode: form.mode,
    bandwidthKHz: bandwidth != null && Number.isFinite(bandwidth) ? bandwidth : null,
    colourCode:
      colourCode != null && Number.isFinite(colourCode) && colourCode >= 0 && colourCode <= 15
        ? colourCode
        : null,
    timeslot,
    dmrId: dmrId != null && Number.isFinite(dmrId) && dmrId > 0 ? dmrId : null,
    rxTone: form.rxTone,
    txTone: form.txTone,
    squelch: form.squelch,
    contactRef: parseEntityRefKey(form.contactRefKey),
    rxGroupListId: form.rxGroupListId || null,
  };
}

export function modeProfileToForm(profile: ChannelModeProfile): ModeProfileFormValues {
  return {
    mode: profile.mode,
    bandwidthKHz: profile.bandwidthKHz != null ? String(profile.bandwidthKHz) : '',
    colourCode: profile.colourCode != null ? String(profile.colourCode) : '',
    timeslot: profile.timeslot != null ? String(profile.timeslot) : '',
    contactRefKey: profile.contactRef ? entityRefKey(profile.contactRef) : '',
    rxGroupListId: profile.rxGroupListId ?? '',
    dmrId: profile.dmrId != null ? String(profile.dmrId) : '',
    rxTone: profile.rxTone,
    txTone: profile.txTone,
    squelch: profile.squelch,
  };
}

export function syncModeProfilesFromSelection(
  selectedModes: ChannelMode[],
  existingProfiles: ModeProfileFormValues[],
): ModeProfileFormValues[] {
  return selectedModes.map((mode) => {
    const existing = existingProfiles.find((p) => p.mode === mode);
    return existing ?? modeProfileToForm(channelModeProfileDefaults(mode));
  });
}

export interface ChannelModeProfilesEditorProps {
  profiles: ModeProfileFormValues[];
  codeplug: Codeplug;
  onChange: (profiles: ModeProfileFormValues[]) => void;
}

export default function ChannelModeProfilesEditor({
  profiles,
  codeplug,
  onChange,
}: ChannelModeProfilesEditorProps) {
  const contactOptions = [
    { value: '', label: 'None' },
    ...codeplug.contacts.map((c) => ({
      value: entityRefKey({ kind: 'contact', id: c.id }),
      label: c.name,
    })),
    ...codeplug.talkGroups.map((tg) => ({
      value: entityRefKey({ kind: 'talkGroup', id: tg.id }),
      label: `${tg.name} (group)`,
    })),
  ];

  const rglOptions = [
    { value: '', label: 'None' },
    ...codeplug.rxGroupLists.map((r) => ({ value: r.id, label: r.name })),
  ];

  const updateProfile = (index: number, patch: Partial<ModeProfileFormValues>) => {
    onChange(profiles.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  if (profiles.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Add at least two mode profiles (e.g. FM and DMR).
      </Text>
    );
  }

  return (
    <Tabs defaultValue={profiles[0]?.mode ?? 'fm'}>
      <Tabs.List>
        {profiles.map((p) => (
          <Tabs.Tab key={p.mode} value={p.mode}>
            <Group gap={6}>
              <ModePill mode={p.mode} size="xs" />
              {modeLabel(p.mode)}
            </Group>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {profiles.map((profile, index) => (
        <Tabs.Panel key={profile.mode} value={profile.mode} pt="md">
          <Stack gap="sm">
            {isAnalogMode(profile.mode) ? (
              <>
                <Select
                  label="Bandwidth (kHz)"
                  data={bandwidthSelectData}
                  value={profile.bandwidthKHz}
                  onChange={(v) => updateProfile(index, { bandwidthKHz: v ?? '' })}
                  clearable
                />
                <Group grow>
                  <Select
                    label="RX tone"
                    data={toneSelectOptions()}
                    value={profile.rxTone}
                    onChange={(v) => updateProfile(index, { rxTone: (v ?? 'none') as ChannelTone })}
                    searchable
                  />
                  <Select
                    label="TX tone"
                    data={toneSelectOptions()}
                    value={profile.txTone}
                    onChange={(v) => updateProfile(index, { txTone: (v ?? 'none') as ChannelTone })}
                    searchable
                  />
                </Group>
                <PercentLevelSlider
                  label="Squelch"
                  value={profile.squelch}
                  onChange={(v) => updateProfile(index, { squelch: v })}
                  zeroLabel="Open (0%)"
                />
              </>
            ) : null}
            {isDmrMode(profile.mode) ? (
              <>
                <Group grow>
                  <NumberInput
                    label="Colour code"
                    value={profile.colourCode === '' ? undefined : parseInt(profile.colourCode, 10)}
                    onChange={(v) =>
                      updateProfile(index, { colourCode: v != null ? String(v) : '' })
                    }
                    min={0}
                    max={15}
                    allowDecimal={false}
                  />
                  <Select
                    label="Timeslot"
                    data={timeslotSelectData}
                    value={profile.timeslot}
                    onChange={(v) => updateProfile(index, { timeslot: v ?? '' })}
                    clearable
                  />
                </Group>
                <NumberInput
                  label="DMR ID"
                  value={profile.dmrId === '' ? undefined : parseInt(profile.dmrId, 10)}
                  onChange={(v) => updateProfile(index, { dmrId: v != null ? String(v) : '' })}
                  min={1}
                  allowDecimal={false}
                />
                <Select
                  label="TX contact"
                  data={contactOptions}
                  value={profile.contactRefKey || ''}
                  onChange={(v) => updateProfile(index, { contactRefKey: v ?? '' })}
                  searchable
                  clearable
                />
                <Select
                  label="RX group list"
                  data={rglOptions}
                  value={profile.rxGroupListId || ''}
                  onChange={(v) => updateProfile(index, { rxGroupListId: v ?? '' })}
                  searchable
                  clearable
                />
              </>
            ) : null}
          </Stack>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
