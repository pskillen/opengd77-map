import { ActionIcon, Checkbox, Group } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ICON_SIZE_ACTION, ICON_STROKE } from '../../lib/iconSizes.ts';

export interface MapControlsProps {
  fullChannelName: boolean;
  onFullChannelNameChange: (value: boolean) => void;
  showZones: boolean;
  onShowZonesChange: (value: boolean) => void;
  compactMode?: boolean;
}

export default function MapControls({
  fullChannelName,
  onFullChannelNameChange,
  showZones,
  onShowZonesChange,
  compactMode = false,
}: MapControlsProps) {
  return (
    <Group gap="md" wrap="wrap" align="center">
      {!compactMode ? (
        <>
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
        </>
      ) : null}
      <ActionIcon
        component={Link}
        to="/settings"
        variant="subtle"
        aria-label="Map settings"
        title="Map settings"
      >
        <IconSettings size={ICON_SIZE_ACTION} stroke={ICON_STROKE} />
      </ActionIcon>
    </Group>
  );
}
