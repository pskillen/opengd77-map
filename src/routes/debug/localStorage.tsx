import { Badge, Code, Text } from '@mantine/core';
import { useMemo } from 'react';
import DataTable from '../../components/ui/DataTable.tsx';
import { Page, PageHeader } from '../../components/ui/index.ts';
import {
  formatByteSize,
  listStorageKeys,
  storageKeyViewerPath,
  type StorageKeyRow,
} from '../../lib/debug/storageKeyRegistry.ts';

export default function DebugLocalStorage() {
  const rows = useMemo(() => listStorageKeys(), []);

  return (
    <Page>
      <PageHeader
        title="LocalStorage"
        description="Keys used by the codeplug tool in this browser."
      />
      <DataTable<StorageKeyRow>
        rows={rows}
        rowKey={(row) => row.key}
        nameColumn={{
          header: 'Label',
          getName: (row) => row.label,
          getPath: (row) => storageKeyViewerPath(row.key),
        }}
        columns={[
          {
            key: 'key',
            header: 'Key',
            render: (row) => (
              <Code style={{ whiteSpace: 'nowrap' }}>{row.key}</Code>
            ),
          },
          {
            key: 'size',
            header: 'Size',
            render: (row) => formatByteSize(row.byteSize),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge color={row.present ? 'green' : 'gray'} variant="light">
                {row.present ? 'Set' : 'Not set'}
              </Badge>
            ),
          },
        ]}
        caption={
          <Text size="sm" c="dimmed">
            Select a label to open the JSON tree viewer for that key.
          </Text>
        }
      />
    </Page>
  );
}
