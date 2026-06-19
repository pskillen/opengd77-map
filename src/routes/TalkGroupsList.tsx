import { Button, Group, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import EntityTable from '../components/report/EntityTable.tsx';
import ReportPage from '../components/report/ReportPage.tsx';
import {
  channelsWithTalkGroupName,
  formatReferenceCount,
  rxGroupListsContainingMember,
  sortByName,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

export default function TalkGroupsList() {
  const { codeplug } = useCodeplug();
  const { channels, talkGroups, rxGroupLists } = codeplug;
  const sorted = sortByName(talkGroups);

  return (
    <ReportPage title="Talk groups">
      <Stack gap="lg">
        <Group justify="flex-end">
          <Button
            component={Link}
            to="/talk-groups/new"
            leftSection={<IconPlus size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            New talk group
          </Button>
        </Group>

        <EntityTable
          rows={sorted}
          rowKey={(tg) => tg.id}
          nameColumn={{
            getName: (tg) => tg.name,
            getPath: (tg) => `/talk-groups/${tg.id}`,
          }}
          columns={[
            { key: 'number', header: 'DMR ID', render: (tg) => tg.number || '—' },
            { key: 'ts', header: 'Timeslot', render: (tg) => tg.timeslotOverride || '—' },
            {
              key: 'channels',
              header: 'Channels using',
              render: (tg) =>
                formatReferenceCount(channelsWithTalkGroupName(tg.name, channels).length),
            },
            {
              key: 'rgl',
              header: 'RX groups using',
              render: (tg) =>
                formatReferenceCount(rxGroupListsContainingMember(tg.name, rxGroupLists).length),
            },
          ]}
        />
      </Stack>
    </ReportPage>
  );
}
