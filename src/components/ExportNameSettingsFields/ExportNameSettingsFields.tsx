import { NumberInput, Select, Stack, Switch, Text } from '@mantine/core';
import { getHelpShort } from '../../content/help/manifest.ts';
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
  /** RX-list fan-out formats only (e.g. DM32). Hidden on OpenGD77 lean export. */
  showMultiTalkGroupOptions?: boolean;
}

export default function ExportNameSettingsFields({
  profileNameLimit,
  showMultiTalkGroupOptions = true,
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
        description={getHelpShort('importExport.exportOptions.shortenNames')}
        checked={shortenNames}
        onChange={(e) => setShortenNames(e.currentTarget.checked)}
      />
      <NumberInput
        label="Target name length"
        description={
          profileNameLimit != null
            ? `${getHelpShort('importExport.exportOptions.maxNameLength')} (profile default: ${profileNameLimit})`
            : getHelpShort('importExport.exportOptions.maxNameLength')
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
        description={getHelpShort('importExport.exportOptions.nameModeOverride')}
        data={nameModeData}
        value={nameModeOverride}
        onChange={(value) => {
          if (value == null) return;
          setNameModeOverride(value as ExportNameModeOverride);
        }}
        allowDeselect={false}
        disabled={!shortenNames}
      />
      {showMultiTalkGroupOptions ? (
        <Switch
          label="Use talk group abbreviations"
          description={getHelpShort('importExport.exportOptions.useTalkGroupAbbreviation')}
          checked={useTalkGroupAbbreviation}
          onChange={(e) => setUseTalkGroupAbbreviation(e.currentTarget.checked)}
          disabled={!shortenNames}
        />
      ) : null}
      <Switch
        label="Use channel abbreviations"
        description={getHelpShort('importExport.exportOptions.useChannelAbbreviation')}
        checked={useChannelAbbreviation}
        onChange={(e) => setUseChannelAbbreviation(e.currentTarget.checked)}
        disabled={!shortenNames}
      />
      {showMultiTalkGroupOptions ? (
        <Select
          label="Multi-talkgroup export name style"
          description={getHelpShort('importExport.exportOptions.multiTalkGroupExportNameMode')}
          data={multiTgNameModeData}
          value={multiTalkGroupExportNameMode}
          onChange={(value) => {
            if (value == null) return;
            setMultiTalkGroupExportNameMode(value as MultiTalkGroupExportNameMode);
          }}
          allowDeselect={false}
          disabled={!shortenNames}
        />
      ) : null}
      <Text size="xs" c="dimmed">
        {getHelpShort('importExport.exportOrder')} Preferences save in browser localStorage.
      </Text>
    </Stack>
  );
}
