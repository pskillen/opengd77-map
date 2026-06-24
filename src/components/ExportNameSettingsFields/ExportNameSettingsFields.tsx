import { NumberInput, Select, Stack, Switch, Text } from '@mantine/core';
import {
  EXPORT_NAME_MODE_RESPECT_PER_CHANNEL,
  useExportSettings,
  type ExportNameModeOverride,
} from '../../hooks/useExportSettings.ts';
import { EXPORT_NAME_MODE_OPTIONS } from '../../lib/channelNaming.ts';
import { MULTI_TG_EXPORT_NAME_MODE_OPTIONS } from '../../lib/channelExpansion/multiTalkGroupWireName.ts';
import type { MultiTalkGroupExportNameMode } from '../../lib/import-export/types.ts';

export interface ExportNameSettingsFieldsProps {
  profileNameLimit?: number;
}

export default function ExportNameSettingsFields({
  profileNameLimit,
}: ExportNameSettingsFieldsProps) {
  const {
    shortenNames,
    setShortenNames,
    maxNameLength,
    setMaxNameLength,
    nameModeOverride,
    setNameModeOverride,
    useTalkGroupAbbreviation,
    setUseTalkGroupAbbreviation,
    useChannelAbbreviation,
    setUseChannelAbbreviation,
    multiTalkGroupExportNameMode,
    setMultiTalkGroupExportNameMode,
  } = useExportSettings();

  const nameModeData = [
    { value: EXPORT_NAME_MODE_RESPECT_PER_CHANNEL, label: 'Respect per-channel setting' },
    ...EXPORT_NAME_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const multiTgNameModeData = MULTI_TG_EXPORT_NAME_MODE_OPTIONS.map((o) => ({
    value: o.value,
    label: `${o.label} (e.g. ${o.example})`,
  }));

  return (
    <Stack gap="sm">
      <Switch
        label="Shorten long channel names"
        description="Abbreviate names that exceed the target length at export time"
        checked={shortenNames}
        onChange={(e) => setShortenNames(e.currentTarget.checked)}
      />
      <NumberInput
        label="Target name length"
        description={
          profileNameLimit != null
            ? `Leave empty to use the radio profile default (${profileNameLimit} characters)`
            : 'Leave empty to use the radio profile default'
        }
        placeholder={profileNameLimit != null ? String(profileNameLimit) : 'Profile default'}
        min={1}
        max={64}
        value={maxNameLength ?? ''}
        onChange={(value) => {
          if (value === '' || value == null) {
            setMaxNameLength(null);
            return;
          }
          const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
          setMaxNameLength(Number.isFinite(n) && n > 0 ? n : null);
        }}
        disabled={!shortenNames}
      />
      <Select
        label="Export name mode override"
        description="Force all channels to one name style for this export (optional)"
        data={nameModeData}
        value={nameModeOverride}
        onChange={(value) => {
          if (value == null) return;
          setNameModeOverride(value as ExportNameModeOverride);
        }}
        allowDeselect={false}
        disabled={!shortenNames}
      />
      <Switch
        label="Use talk group abbreviations"
        description="Prefer TalkGroup.abbreviation for multi-talkgroup channel suffixes"
        checked={useTalkGroupAbbreviation}
        onChange={(e) => setUseTalkGroupAbbreviation(e.currentTarget.checked)}
        disabled={!shortenNames}
      />
      <Switch
        label="Use channel abbreviations"
        description="Prefer Channel.abbreviation for the name qualifier in export wire names"
        checked={useChannelAbbreviation}
        onChange={(e) => setUseChannelAbbreviation(e.currentTarget.checked)}
        disabled={!shortenNames}
      />
      <Select
        label="Multi-talkgroup export name style"
        description="How expanded RX-list rows name channels on the radio LCD. Tightens automatically if still too long."
        data={multiTgNameModeData}
        value={multiTalkGroupExportNameMode}
        onChange={(value) => {
          if (value == null) return;
          setMultiTalkGroupExportNameMode(value as MultiTalkGroupExportNameMode);
        }}
        allowDeselect={false}
        disabled={!shortenNames}
      />
      <Text size="xs" c="dimmed">
        Preferences are saved in browser localStorage.
      </Text>
    </Stack>
  );
}
