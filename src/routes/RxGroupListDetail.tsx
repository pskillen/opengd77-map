import { Anchor, Badge, Group, Stack, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import EntityTable from '../components/report/EntityTable.tsx';
import DetailSections from '../components/report/DetailSections.tsx';
import NotFoundEntity from '../components/report/NotFoundEntity.tsx';
import ReportPage from '../components/report/ReportPage.tsx';
import {
  channelsWithRxGroupList,
  findEntityById,
  resolveRxGroupListMembers,
} from '../lib/reportLookup.ts';
import type { Contact, TalkGroup } from '../models/codeplug.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';
import { modeLabel } from '../lib/channelModes.ts';

export default function RxGroupListDetail() {
  const { id } = useParams<{ id: string }>();
  const { codeplug } = useCodeplug();
  const rgl = id ? findEntityById(codeplug.rxGroupLists, id) : null;

  if (!rgl) {
    return (
      <ReportPage title="RX Group List">
        <NotFoundEntity entityLabel="RX Group List" listPath="/rx-group-lists" />
      </ReportPage>
    );
  }

  const members = resolveRxGroupListMembers(rgl, codeplug.talkGroups, codeplug.contacts);
  const usingChannels = channelsWithRxGroupList(rgl.name, codeplug.channels);

  return (
    <ReportPage title={rgl.name}>
      <Stack gap="lg">
        <Anchor component={Link} to="/rx-group-lists" size="sm">
          <Group gap={4} wrap="nowrap">
            <IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
            RX Group Lists
          </Group>
        </Anchor>

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
          <EntityTable
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
          <EntityTable
            rows={usingChannels}
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
      </Stack>
    </ReportPage>
  );
}
