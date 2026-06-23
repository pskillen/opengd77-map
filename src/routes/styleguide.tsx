import {
  Alert,
  Badge,
  Button,
  Group,
  NavLink,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import BandPill, { BandPillForChannel } from '../components/crud/BandPill.tsx';
import ConfirmDeleteModal from '../components/crud/ConfirmDeleteModal.tsx';
import ModePill from '../components/crud/ModePill.tsx';
import {
  DataTable,
  EmptyState,
  FormPage,
  FormSection,
  ListPage,
  Page,
  PageHeader,
  PageSection,
  PageSectionGrid,
} from '../components/ui/index.ts';
import { UK_BANDS } from '../lib/bands.ts';
import { channelFieldDefaults } from '../models/codeplug.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

const SAMPLE_ROWS = [
  { id: '1', name: 'GB3DA Stornoway' },
  { id: '2', name: 'GB3IV Inverness' },
];

const STICKY_DEMO_ROWS = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  name: `Channel ${String(i + 1).padStart(2, '0')}`,
  score: (i * 7) % 100,
}));

const COLUMN_PICKER_ROWS = [
  { id: '1', name: 'Alpha', score: 3, note: 'A' },
  { id: '2', name: 'Bravo', score: 9, note: 'B' },
];

const sampleChannel = {
  ...channelFieldDefaults(),
  id: 'demo',
  name: 'Demo FM',
  callsign: '',
  mode: 'fm' as const,
  rxFrequency: 145_575_000,
  txFrequency: 145_175_000,
};

export default function Styleguide() {
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const filteredStickyRows = useMemo(() => {
    if (!search) return STICKY_DEMO_ROWS;
    const q = search.toLowerCase();
    return STICKY_DEMO_ROWS.filter((r) => r.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <Page width="default">
      <PageHeader
        title="UI styleguide"
        description="Hidden dev page — demos shared kit primitives. Not linked from navigation."
      />

      <PageSection title="Page layout" description="PageHeader, PageSection, PageSectionGrid">
        <PageSectionGrid>
          <PageSection title="Card A" description="Bordered section panel">
            <Text size="sm">Section body content.</Text>
          </PageSection>
          <PageSection title="Card B" description="Second column from md breakpoint">
            <Text size="sm">Mirrors import/export layout.</Text>
          </PageSection>
        </PageSectionGrid>
      </PageSection>

      <PageSection title="ListPage sample">
        <ListPage
          title="Channels (sample)"
          description="Composed list shell inside a section for demo."
        >
          <DataTable
            rows={SAMPLE_ROWS}
            rowKey={(row) => row.id}
            nameColumn={{
              getName: (row) => row.name,
              getPath: (row) => `/channels/${row.id}`,
            }}
            columns={[{ key: 'band', header: 'Band', render: () => '2m' }]}
          />
        </ListPage>
      </PageSection>

      <PageSection title="DataTable — empty">
        <DataTable
          rows={[]}
          rowKey={(row: { id: string }) => row.id}
          nameColumn={{
            getName: (row: { id: string; name: string }) => row.name,
            getPath: () => '#',
          }}
          columns={[]}
          emptyState={<EmptyState message="No channels yet" />}
        />
      </PageSection>

      <PageSection
        title="DataTable — sort, sticky header, search"
        description="Scroll inside the table; click Name or Score to sort."
      >
        <DataTable
          rows={filteredStickyRows}
          totalRowCount={STICKY_DEMO_ROWS.length}
          rowKey={(row) => row.id}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filter demo channels…"
          nameColumn={{
            getName: (row) => row.name,
            getPath: (row) => `#channel-${row.id}`,
          }}
          columns={[
            {
              key: 'score',
              header: 'Score',
              render: (row) => row.score,
              sortValue: (row) => row.score,
            },
          ]}
        />
      </PageSection>

      <PageSection title="DataTable — column picker">
        <DataTable
          rows={COLUMN_PICKER_ROWS}
          rowKey={(row) => row.id}
          nameColumn={{
            getName: (row) => row.name,
            getPath: (row) => `#${row.id}`,
          }}
          columns={[
            {
              key: 'score',
              header: 'Score',
              render: (row) => row.score,
              sortValue: (row) => row.score,
              hideable: true,
              defaultVisible: true,
            },
            {
              key: 'note',
              header: 'Note',
              render: (row) => row.note,
              hideable: true,
              defaultVisible: false,
            },
          ]}
          columnVisibilityStorageKey="styleguide-datatable-columns"
        />
      </PageSection>

      <PageSection title="DataTable — selection">
        <DataTable
          rows={COLUMN_PICKER_ROWS}
          rowKey={(row) => row.id}
          selectable
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          nameColumn={{
            getName: (row) => row.name,
            getPath: (row) => `#${row.id}`,
          }}
          columns={[
            {
              key: 'score',
              header: 'Score',
              render: (row) => row.score,
              sortValue: (row) => row.score,
            },
          ]}
        />
        <Text size="sm" c="dimmed" mt="xs">
          Selected: {selectedKeys.length ? selectedKeys.join(', ') : 'none'}
        </Text>
      </PageSection>

      <PageSection title="DataTable — filtered empty">
        <DataTable
          rows={[]}
          totalRowCount={12}
          rowKey={(row: { id: string }) => row.id}
          nameColumn={{
            getName: (row: { id: string; name: string }) => row.name,
            getPath: () => '#',
          }}
          columns={[]}
          filteredEmptyMessage="No matches for current filter"
        />
      </PageSection>

      <PageSection title="Form fields & buttons">
        <Stack gap="lg">
          <Group>
            <Button>Primary</Button>
            <Button variant="light">Light</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="outline">Outline</Button>
            <Button
              color="red"
              leftSection={<IconTrash size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            >
              Delete
            </Button>
          </Group>
          <FormSection
            title="Sample fields"
            description="Native Mantine inputs — canonical variants."
          >
            <TextInput label="Name" placeholder="Channel name" />
            <Select label="Mode" data={['FM', 'DMR', 'P25']} defaultValue="FM" />
          </FormSection>
        </Stack>
      </PageSection>

      <PageSection title="FormPage sample">
        <FormPage
          title="Edit channel (sample)"
          description="Sticky footer on mobile viewports."
          footer={
            <>
              <Button variant="light">Cancel</Button>
              <Button>Save</Button>
            </>
          }
        >
          <TextInput label="Name" defaultValue="Demo channel" />
        </FormPage>
      </PageSection>

      <PageSection title="Pills & badges">
        <Group>
          <ModePill mode="dmr" />
          <ModePill mode="fm" />
          <BandPill band={UK_BANDS.find((b) => b.id === '2m') ?? null} />
          <BandPillForChannel channel={sampleChannel} />
          <Badge variant="outline">Outline badge</Badge>
        </Group>
      </PageSection>

      <PageSection title="Alerts">
        <Stack gap="sm">
          <Alert color="blue">Informational alert.</Alert>
          <Alert color="yellow">Warning alert — map token missing pattern.</Alert>
          <Alert color="red">Error alert — validation failure pattern.</Alert>
        </Stack>
      </PageSection>

      <PageSection title="EmptyState">
        <EmptyState
          message="No codeplugs yet"
          action={
            <Button variant="light" component={Link} to="/">
              Go home
            </Button>
          }
        />
      </PageSection>

      <PageSection title="Nav samples">
        <Stack gap="xs" maw={280}>
          <Text size="sm" c="dimmed">
            NavLink styling (inactive / active)
          </Text>
          <NavLink label="Channels" active />
          <NavLink label="Settings" />
        </Stack>
      </PageSection>

      <PageSection title="Modal">
        <Button color="red" onClick={openDelete}>
          Open ConfirmDeleteModal
        </Button>
        <ConfirmDeleteModal
          opened={deleteOpened}
          onClose={closeDelete}
          onConfirm={closeDelete}
          title="Delete channel"
          entityName="GB3DA Stornoway"
        />
      </PageSection>
    </Page>
  );
}
