import { Anchor, Badge, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDeleteModal from '../components/crud/ConfirmDeleteModal.tsx';
import { BandPillForChannel } from '../components/crud/BandPill.tsx';
import ModePill from '../components/crud/ModePill.tsx';
import { DataTable, Page, PageHeader } from '../components/ui/index.ts';
import DetailSections from '../components/report/DetailSections.tsx';
import NotFoundEntity from '../components/report/NotFoundEntity.tsx';

import {
  channelsReferencingRxGroupListId,
  findEntityById,
  resolveRxGroupListMembers,
} from '../lib/reportLookup.ts';
import type { Contact, TalkGroup } from '../models/codeplug.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

export default function RxGroupListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, deleteRxGroupList } = useCodeplug();
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const rgl = id ? findEntityById(codeplug.rxGroupLists, id) : null;

  if (!rgl) {
    return (
      <Page>
        <PageHeader title="RX Group List" />
        <NotFoundEntity entityLabel="RX Group List" listPath="/rx-group-lists" />
      </Page>
    );
  }

  const members = resolveRxGroupListMembers(rgl, codeplug.talkGroups, codeplug.contacts);
  const usingChannels = channelsReferencingRxGroupListId(rgl.id, codeplug.channels);

  const confirmDelete = () => {
    deleteRxGroupList(rgl.id);
    closeDelete();
    navigate('/rx-group-lists');
  };

  return (
    <Page>
      <PageHeader title={rgl.name} />
      <Stack gap="lg">
        <Group justify="space-between">
          <Anchor component={Link} to="/rx-group-lists" size="sm">
            <Group gap={4} wrap="nowrap">
              <IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
              RX Group Lists
            </Group>
          </Anchor>
          <Group gap="sm">
            <Button
              component={Link}
              to={`/rx-group-lists/${rgl.id}/edit`}
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
                { label: 'Name', value: rgl.name },
                { label: 'Members', value: String(members.length) },
              ],
            },
          ]}
        />

        <Stack gap="sm">
          <Title order={3}>Members</Title>
          <DataTable
            rows={members}
            rowKey={(m) => m.name}
            nameColumn={{
              header: 'Name',
              getName: (m) => m.name,
              getPath: (m) => {
                if (m.kind === 'talkGroup' && m.entity) {
                  return `/talk-groups/${(m.entity as TalkGroup).id}`;
                }
                if (m.kind === 'contact' && m.entity) {
                  return `/contacts/${(m.entity as Contact).id}`;
                }
                return `/rx-group-lists/${rgl.id}`;
              },
            }}
            columns={[
              {
                key: 'kind',
                header: 'Type',
                render: (m) => {
                  if (m.kind === 'talkGroup') return <Badge size="sm">Talk group</Badge>;
                  if (m.kind === 'contact')
                    return (
                      <Badge size="sm" color="grape">
                        Private
                      </Badge>
                    );
                  return (
                    <Badge size="sm" color="yellow">
                      Unresolved
                    </Badge>
                  );
                },
              },
            ]}
          />
        </Stack>

        <Stack gap="sm">
          <Title order={3}>Channels using this list</Title>
          {usingChannels.length === 0 ? (
            <Text size="sm" c="dimmed">
              No channels reference this RX group list.
            </Text>
          ) : (
            <DataTable
              rows={usingChannels}
              rowKey={(ch) => ch.id}
              nameColumn={{
                getName: (ch) => ch.name,
                getPath: (ch) => `/channels/${ch.id}`,
              }}
              columns={[
                {
                  key: 'band',
                  header: 'Band',
                  render: (ch) => <BandPillForChannel channel={ch} />,
                },
                { key: 'mode', header: 'Mode', render: (ch) => <ModePill mode={ch.mode} /> },
              ]}
            />
          )}
        </Stack>
      </Stack>

      <ConfirmDeleteModal
        opened={deleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Delete RX group list"
        entityName={rgl.name}
        warning={
          usingChannels.length > 0
            ? `${usingChannels.length} channel(s) will have their RX group list cleared.`
            : undefined
        }
      />
    </Page>
  );
}
