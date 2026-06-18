import { SegmentedControl, Stack, Text } from '@mantine/core';
import { mapChannelMode, type ChannelMode } from '../../models/codeplug.ts';
import classes from './ChannelModeSegmentedControl.module.css';

const MODE_DATA = [
  { label: 'Digital', value: 'digital' },
  { label: 'Analogue', value: 'analogue' },
  { label: 'Other', value: 'other' },
] as const;

export interface ChannelModeSegmentedControlProps {
  value: ChannelMode;
  onChange: (mode: ChannelMode) => void;
}

export default function ChannelModeSegmentedControl({
  value,
  onChange,
}: ChannelModeSegmentedControlProps) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        Mode
      </Text>
      <SegmentedControl
        classNames={classes}
        data={[...MODE_DATA]}
        value={value}
        onChange={(v) => onChange(mapChannelMode(v))}
        fullWidth
      />
    </Stack>
  );
}
