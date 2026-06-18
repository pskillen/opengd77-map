import { Button, Group, Stack, Text } from '@mantine/core';
import ImportDropzone from '../ImportDropzone/ImportDropzone.tsx';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export default function ImportPanel() {
  const { codeplug, applyImport, clear, persistenceError, clearPersistenceError } = useCodeplug();

  const channelCount = codeplug.channels.length;
  const zoneCount = codeplug.zones.length;

  return (
    <Stack gap="sm">
      <ImportDropzone
        onResult={applyImport}
        persistenceError={persistenceError}
        onDismissPersistenceError={clearPersistenceError}
      />

      {channelCount > 0 || zoneCount > 0 ? (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {channelCount} channel{channelCount === 1 ? '' : 's'}
            {zoneCount ? ` · ${zoneCount} zone${zoneCount === 1 ? '' : 's'}` : ''} loaded
          </Text>
          <Button variant="subtle" color="red" size="compact-sm" onClick={() => clear()}>
            Clear all
          </Button>
        </Group>
      ) : null}
    </Stack>
  );
}
