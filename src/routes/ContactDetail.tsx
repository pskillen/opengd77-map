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
  channelsReferencingContactId,
  findEntityById,
  formatReferenceCount,
  rxGroupListsContainingMemberRef,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';
import { modeLabel } from '../lib/channelModes.ts';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, deleteContact } = useCodeplug();
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const contact = id ? findEntityById(codeplug.contacts, id) : null;

  if (!contact) {
    return (
      <ReportPage title="Contact">
        <NotFoundEntity entityLabel="Contact" listPath="/contacts" />
      </ReportPage>
    );
  }

  const usingChannels = channelsReferencingContactId(contact.id, codeplug.channels);
  const usingLists = rxGroupListsContainingMemberRef(
    { kind: 'contact', id: contact.id },
    codeplug.rxGroupLists,
  );

  const deleteWarningParts: string[] = [];
  if (usingChannels.length > 0) {
    deleteWarningParts.push(
      `${usingChannels.length} channel(s) will have their TX contact cleared.`,
    );
  }
  if (usingLists.length > 0) {
    deleteWarningParts.push(
      `This contact will be removed from ${usingLists.length} RX group list(s).`,
    );
  }

  const confirmDelete = () => {
    deleteContact(contact.id);
    closeDelete();
    navigate('/contacts');
  };

  return (
    <ReportPage title={contact.name}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Anchor component={Link} to="/contacts" size="sm">
            <Group gap={4} wrap="nowrap">
              <IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
              Contacts
            </Group>
          </Anchor>
          <Group gap="sm">
            <Button
              component={Link}
              to={`/contacts/${contact.id}/edit`}
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
                { label: 'Name', value: contact.name },
                { label: 'DMR ID', value: contact.number },
                { label: 'Timeslot override', value: contact.timeslotOverride },
              ],
            },
          ]}
        />

        <Stack gap="sm">
          <Title order={3}>Channels using this contact (TX contact)</Title>
          {usingChannels.length === 0 ? (
            <Text size="sm" c="dimmed">
              No channels reference this contact.
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
          <Title order={3}>RX groups using this contact</Title>
          {usingLists.length === 0 ? (
            <Text size="sm" c="dimmed">
              No RX group lists include this contact.
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
        title="Delete contact"
        entityName={contact.name}
        warning={deleteWarningParts.length > 0 ? deleteWarningParts.join(' ') : undefined}
      />
    </ReportPage>
  );
}
