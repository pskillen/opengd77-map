import { Select, Stack, Text, MultiSelect } from '@mantine/core';
import { CHANNEL_MODES, modeLabel, type ChannelMode } from '../../lib/channelModes.ts';

export interface ChannelModeSelectProps {
  value: ChannelMode;
  onChange: (mode: ChannelMode) => void;
}

export default function ChannelModeSelect({ value, onChange }: ChannelModeSelectProps) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        Mode
      </Text>
      <Select
        data={CHANNEL_MODES.map((m) => ({ value: m.id, label: m.label }))}
        value={value}
        onChange={(v) => {
          if (v) onChange(v as ChannelMode);
        }}
        searchable
      />
    </Stack>
  );
}

export interface ChannelModesMultiSelectProps {
  value: ChannelMode[];
  onChange: (modes: ChannelMode[]) => void;
}

export function ChannelModesMultiSelect({ value, onChange }: ChannelModesMultiSelectProps) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        Modes
      </Text>
      <MultiSelect
        data={CHANNEL_MODES.map((m) => ({ value: m.id, label: m.label }))}
        value={value}
        onChange={(selected) => onChange(selected as ChannelMode[])}
        searchable
      />
    </Stack>
  );
}

export interface ChannelPrimaryModeSelectProps {
  value: ChannelMode;
  modes: ChannelMode[];
  onChange: (mode: ChannelMode) => void;
}

export function ChannelPrimaryModeSelect({
  value,
  modes,
  onChange,
}: ChannelPrimaryModeSelectProps) {
  return (
    <Select
      label="Primary mode"
      description="List filters and map display lead with this mode"
      data={modes.map((m) => ({ value: m, label: modeLabel(m) }))}
      value={value}
      onChange={(v) => {
        if (v) onChange(v as ChannelMode);
      }}
    />
  );
}
