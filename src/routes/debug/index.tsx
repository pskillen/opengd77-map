import { Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { Page, PageHeader } from '../../components/ui/index.ts';

export default function DebugIndex() {
  return (
    <Page>
      <PageHeader
        title="Debug"
        description="Read-only inspection tools for browser-local app state."
      />
      <Text c="dimmed" size="sm" mb="md">
        Data shown here stays in your browser and may include operator codeplug content. Nothing is
        sent to a server.
      </Text>
      <Text size="sm">
        <Link to="/debug/local-storage">LocalStorage</Link> — view persisted keys and their JSON
        values.
      </Text>
    </Page>
  );
}
