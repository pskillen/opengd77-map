import { Alert, Anchor, Button, Group, List, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  IconAddressBook,
  IconAntenna,
  IconFolders,
  IconListDetails,
  IconPencil,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import CodeplugMap from '../CodeplugMap/CodeplugMap.tsx';
import { HelpAlert } from '../help/index.ts';
import { Page, PageHeader } from '../ui/index.ts';
import SummaryCard from '../report/SummaryCard.tsx';
import { applyFilters } from '../../lib/channels.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { sortByName } from '../../lib/reportLookup.ts';
import type { Codeplug } from '../../models/codeplug.ts';
import type { CodeplugProject } from '../../models/codeplugProject.ts';
import { useOperatorPosition } from '../../state/operatorPosition.tsx';

function entityIcon(Icon: typeof IconAntenna) {
  return <Icon size={ICON_SIZE_NAV} stroke={ICON_STROKE} />;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export interface SummaryDashboardProps {
  project: CodeplugProject;
  codeplug: Codeplug;
}

export default function SummaryDashboard({ project, codeplug }: SummaryDashboardProps) {
  const { channels, zones, talkGroups, contacts, rxGroupLists, meta } = codeplug;
  const { position } = useOperatorPosition();

  const { plotted: geolocatedChannels } = applyFilters(channels, {
    requireUseLocation: true,
    skipZero: true,
  });
  const geolocatedCount = geolocatedChannels.length;
  const totalChannels = channels.length;

  const preview = <T extends { name: string }>(items: T[]) =>
    sortByName(items)
      .slice(0, 3)
      .map((i) => i.name);

  return (
    <Page>
      <PageHeader title={project.name} />
      <Stack gap="lg">
        <HelpAlert helpId="project.dashboard" color="gray" />
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            {project.description ? (
              <Text size="lg" fw={500}>
                {project.description}
              </Text>
            ) : null}
            {project.author ? (
              <Text size="sm" c="dimmed">
                By {project.author}
              </Text>
            ) : null}
            {project.targetRadios.length > 0 ? (
              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  Target radios
                </Text>
                <List size="sm" spacing={2}>
                  {project.targetRadios.map((radio) => (
                    <List.Item key={radio}>{radio}</List.Item>
                  ))}
                </List>
              </Stack>
            ) : null}
            {project.notes ? (
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {project.notes}
              </Text>
            ) : null}
            <Text size="xs" c="dimmed">
              Created {formatTimestamp(project.createdAt)} · Updated{' '}
              {formatTimestamp(project.updatedAt)}
            </Text>
            {meta.importedAt ? (
              <Text size="sm" c="dimmed">
                Imported {formatTimestamp(meta.importedAt)}
                {meta.sourceFiles.length ? ` · ${meta.sourceFiles.join(', ')}` : ''}
              </Text>
            ) : null}
          </Stack>
          <Button
            component={Link}
            to="/summary/edit"
            variant="light"
            leftSection={<IconPencil size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            Edit project
          </Button>
        </Group>

        <Stack gap="xs">
          {geolocatedCount > 0 ? (
            <>
              <Text size="sm" c="dimmed">
                {geolocatedCount} of {totalChannels} channel{totalChannels === 1 ? '' : 's'} on map
              </Text>
              <CodeplugMap
                channels={channels}
                zones={zones}
                allChannels={channels}
                talkGroups={codeplug.talkGroups}
                contacts={codeplug.contacts}
                rxGroupLists={codeplug.rxGroupLists}
                height={420}
                defaultShowZones
                operatorPosition={position}
              />
            </>
          ) : (
            <Alert variant="light" title="No geolocated channels">
              <Stack gap="xs">
                <Text size="sm">Add locations on channel records to see them on the map.</Text>
                <Anchor component={Link} to="/channels" size="sm">
                  Go to channels
                </Anchor>
              </Stack>
            </Alert>
          )}
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <SummaryCard
            title="Channels"
            count={channels.length}
            previewNames={preview(channels)}
            listPath="/channels"
            icon={entityIcon(IconAntenna)}
            compact
          />
          <SummaryCard
            title="Zones"
            count={zones.length}
            previewNames={preview(zones)}
            listPath="/zones"
            icon={entityIcon(IconFolders)}
            compact
          />
          <SummaryCard
            title="Talk groups"
            count={talkGroups.length}
            previewNames={preview(talkGroups)}
            listPath="/talk-groups"
            icon={entityIcon(IconUsersGroup)}
            compact
          />
          <SummaryCard
            title="Contacts"
            count={contacts.length}
            previewNames={preview(contacts)}
            listPath="/contacts"
            icon={entityIcon(IconAddressBook)}
            compact
          />
          <SummaryCard
            title="RX Group Lists"
            count={rxGroupLists.length}
            previewNames={preview(rxGroupLists)}
            listPath="/rx-group-lists"
            icon={entityIcon(IconListDetails)}
            compact
          />
        </SimpleGrid>
      </Stack>
    </Page>
  );
}
