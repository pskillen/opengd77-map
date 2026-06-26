import { Anchor, Badge, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import { DataTable } from '../ui/index.ts';
import {
  formatRglMemberTimeslot,
  resolveRxGroupListMembers,
} from '../../lib/reportLookup.ts';
import type { Contact, RxGroupList, TalkGroup } from '../../models/codeplug.ts';

export interface RxGroupListMembersTableProps {
  rxGroupList: RxGroupList;
  talkGroups: TalkGroup[];
  contacts: Contact[];
  /** Tighter layout for embedding on channel detail. */
  compact?: boolean;
}

export default function RxGroupListMembersTable({
  rxGroupList,
  talkGroups,
  contacts,
  compact = false,
}: RxGroupListMembersTableProps) {
  const members = resolveRxGroupListMembers(rxGroupList, talkGroups, contacts);

  if (members.length === 0) {
    return null;
  }

  return (
    <DataTable
      variant="embedded"
      rows={members}
      rowKey={(m) => `${m.kind}:${m.name}:${m.timeslot ?? ''}`}
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
          return `/rx-group-lists/${rxGroupList.id}`;
        },
      }}
      columns={[
        {
          key: 'kind',
          header: 'Type',
          render: (m) => {
            if (m.kind === 'talkGroup') {
              return (
                <Badge size={compact ? 'xs' : 'sm'}>
                  Talk group
                </Badge>
              );
            }
            if (m.kind === 'contact') {
              return (
                <Badge size={compact ? 'xs' : 'sm'} color="grape">
                  Private
                </Badge>
              );
            }
            return (
              <Badge size={compact ? 'xs' : 'sm'} color="yellow">
                Unresolved
              </Badge>
            );
          },
          sortValue: (m) => m.kind,
        },
        {
          key: 'timeslot',
          header: 'Timeslot',
          render: (m) => {
            if (m.kind === 'talkGroup') return formatRglMemberTimeslot(m.timeslot);
            if (m.kind === 'contact' && m.entity) {
              const override = (m.entity as Contact).timeslotOverride?.trim();
              return override || '—';
            }
            return '—';
          },
          sortValue: (m) =>
            m.kind === 'talkGroup'
              ? (m.timeslot ?? 0)
              : ((m.entity as Contact | null)?.timeslotOverride ?? ''),
        },
      ]}
    />
  );
}

export function RxGroupListDetailValue({
  rxGroupList,
  talkGroups,
  contacts,
  compact = false,
}: RxGroupListMembersTableProps) {
  return (
    <Stack gap="xs">
      <Anchor component={Link} to={`/rx-group-lists/${rxGroupList.id}`}>
        {rxGroupList.name}
      </Anchor>
      <RxGroupListMembersTable
        rxGroupList={rxGroupList}
        talkGroups={talkGroups}
        contacts={contacts}
        compact={compact}
      />
    </Stack>
  );
}
