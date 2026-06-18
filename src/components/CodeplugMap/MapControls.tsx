import { ActionIcon, Checkbox, Group } from '@mantine/core';
import { Link } from 'react-router-dom';

export interface MapControlsProps {
  fullChannelName: boolean;
  onFullChannelNameChange: (value: boolean) => void;
  showZones: boolean;
  onShowZonesChange: (value: boolean) => void;
}

export default function MapControls({
  fullChannelName,
  onFullChannelNameChange,
  showZones,
  onShowZonesChange,
}: MapControlsProps) {
  return (
    <Group gap="md" wrap="wrap" align="center">
      <Checkbox
        label="Label with full channel name"
        checked={fullChannelName}
        onChange={(e) => onFullChannelNameChange(e.currentTarget.checked)}
      />
      <Checkbox
        label="Draw zones"
        checked={showZones}
        onChange={(e) => onShowZonesChange(e.currentTarget.checked)}
      />
      <ActionIcon
        component={Link}
        to="/settings"
        variant="subtle"
        aria-label="Map settings"
        title="Map settings"
      >
        ⚙
      </ActionIcon>
    </Group>
  );
}
