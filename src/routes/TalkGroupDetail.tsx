import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDeleteModal from '../components/crud/ConfirmDeleteModal.tsx';
import EntityTable from '../components/report/EntityTable.tsx';
import DetailSections from '../components/report/DetailSections.tsx';
import NotFoundEntity from '../components/report/NotFoundEntity.tsx';
import ReportPage from '../components/report/ReportPage.tsx';
import { getMemberWireNames } from '../lib/entityProvenance.ts';
import { formatFrequencyHz } from '../lib/formatFrequency.ts';
import {
  channelsWithTalkGroupName,
  findEntityById,
  formatReferenceCount,
  rxGroupListsContainingMember,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';
import { modeLabel } from '../lib/channelModes.ts';

export default function TalkGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, deleteTalkGroup } = useCodeplug();
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const talkGroup = id ? findEntityById(codeplug.talkGroups, id) : null;

  if (!talkGroup) {
    return (
      <ReportPage title="Talk group">
        <NotFoundEntity entityLabel="Talk group" listPath="/talk-groups" />
      </ReportPage>
    );
  }

  const usingChannels = channelsWithTalkGroupName(talkGroup.name, codeplug.channels);
  const usingLists = rxGroupListsContainingMember(talkGroup.name, codeplug.rxGroupLists);

  const deleteWarningParts: string[] = [];
  if (usingChannels.length > 0) {
    deleteWarningParts.push(
      `${usingChannels.length} channel(s) will have their TX contact cleared.`,
    );
  }
  if (usingLists.length > 0) {
    deleteWarningParts.push(
      `This talk group will be removed from ${usingLists.length} RX group list(s).`,
    );
  }

  const confirmDelete = () => {
    deleteTalkGroup(talkGroup.id);
    closeDelete();
    navigate('/talk-groups');
  };

  return (
    <ReportPage title={talkGroup.name}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Anchor component={Link} to="/talk-groups" size="sm">
            <Group gap={4} wrap="nowrap">
              <IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
              Talk groups
            </Group>
          </Anchor>
          <Group gap="sm">
            <Button
              component={Link}
              to={`/talk-groups/${talkGroup.id}/edit`}
              variant="light"
              size="sm"
              leftSection={<IconPencil size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            >
              Edit
            </Button>
            <Button
              color="red"
              variant="light"
              size="sm"
              onClick={openDelete}
              leftSection={<IconTrash size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            >
              Delete
            </Button>
          </Group>
        </Group>

        <DetailSections
          sections={[
            {
              title: 'Details',
              fields: [
                { label: 'Name', value: talkGroup.name },
                { label: 'DMR ID', value: talkGroup.number },
                { label: 'Timeslot override', value: talkGroup.timeslotOverride },
              ],
            },
          ]}
        />

        <Stack gap="sm">
          <Title order={3}>Channels using this talk group (TX contact)</Title>
          {usingChannels.length === 0 ? (
            <Text size="sm" c="dimmed">
              No channels reference this talk group.
            </Text>
          ) : (
            <EntityTable
              rows={usingChannels}
              rowKey={(ch) => ch.id}
              nameColumn={{
                getName: (ch) => ch.name,
                getPath: (ch) => `/channels/${ch.id}`,
              }}
              columns={[
                { key: 'mode', header: 'Mode', render: (ch) => modeLabel(ch.mode) },
                {
                  key: 'rx',
                  header: 'RX MHz',
                  render: (ch) =>
                    ch.rxFrequency ? formatFrequencyHz(ch.rxFrequency).replace(' MHz', '') : '—',
                },
              ]}
            />
          )}
        </Stack>

        <Stack gap="sm">
          <Title order={3}>RX groups using this talk group</Title>
          {usingLists.length === 0 ? (
            <Text size="sm" c="dimmed">
              No RX group lists include this talk group.
            </Text>
          ) : (
            <EntityTable
              rows={usingLists}
              rowKey={(rgl) => rgl.id}
              nameColumn={{
                getName: (rgl) => rgl.name,
                getPath: (rgl) => `/rx-group-lists/${rgl.id}`,
              }}
              columns={[
                {
                  key: 'members',
                  header: 'Members',
                  render: (rgl) => formatReferenceCount(getMemberWireNames(rgl).length),
                },
              ]}
            />
          )}
        </Stack>
      </Stack>

      <ConfirmDeleteModal
        opened={deleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Delete talk group"
        entityName={talkGroup.name}
        warning={deleteWarningParts.length > 0 ? deleteWarningParts.join(' ') : undefined}
      />
    </ReportPage>
  );
}
