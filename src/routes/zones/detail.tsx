import { Anchor, Button, Group, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import ConfirmDeleteModal from '../../components/crud/ConfirmDeleteModal.tsx';
import EntityTable from '../../components/report/EntityTable.tsx';
import DetailSections from '../../components/report/DetailSections.tsx';
import NotFoundEntity from '../../components/report/NotFoundEntity.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { channelsForZone, findEntityById } from '../../lib/reportLookup.ts';
import type { Channel } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

function modeLabel(mode: Channel['mode']): string {
  if (mode === 'digital') return 'Digital';
  if (mode === 'analogue') return 'Analogue';
  return 'Other';
}

export default function ZoneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, deleteZone } = useCodeplug();
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const zone = id ? findEntityById(codeplug.zones, id) : null;

  if (!zone) {
    return (
      <ReportPage title="Zone">
        <NotFoundEntity entityLabel="Zone" listPath="/zones" />
      </ReportPage>
    );
  }

  const members = channelsForZone(zone, codeplug.channels);

  const confirmDelete = () => {
    deleteZone(zone.id);
    closeDelete();
    navigate('/zones');
  };

  return (
    <ReportPage title={zone.name}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Anchor component={Link} to="/zones" size="sm">
            ← Zones
          </Anchor>
          <Group gap="sm">
            <Button component={Link} to={`/zones/${zone.id}/edit`} variant="light" size="sm">
              Edit
            </Button>
            <Button color="red" variant="light" size="sm" onClick={openDelete}>
              Delete
            </Button>
          </Group>
        </Group>

        <DetailSections
          sections={[
            {
              title: 'Overview',
              fields: [
                { label: 'Name', value: zone.name },
                { label: 'Member channels', value: String(members.length) },
              ],
            },
          ]}
        />

        <Stack gap="sm">
          <Title order={3}>Member channels</Title>
          <EntityTable
            rows={members}
            rowKey={(ch) => ch.id}
            nameColumn={{
              getName: (ch) => ch.name,
              getPath: (ch) => `/channels/${ch.id}`,
            }}
            columns={[
              { key: 'mode', header: 'Mode', render: (ch) => modeLabel(ch.mode) },
              { key: 'rx', header: 'RX MHz', render: (ch) => ch.rxFrequency || '—' },
            ]}
          />
        </Stack>

        <Stack gap="sm">
          <Title order={3}>Map</Title>
          <CodeplugMap
            channels={members}
            zones={[zone]}
            allChannels={codeplug.channels}
            defaultShowZones
          />
        </Stack>
      </Stack>

      <ConfirmDeleteModal
        opened={deleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Delete zone"
        entityName={zone.name}
      />
    </ReportPage>
  );
}
