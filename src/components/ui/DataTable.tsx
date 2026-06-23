import { Anchor, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import EmptyState from './EmptyState.tsx';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export type DataTableMobileColumnPolicy = 'none' | 'collapse';

export interface DataTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  nameColumn: {
    header?: string;
    getName: (row: T) => string;
    getPath: (row: T) => string;
  };
  columns: DataTableColumn<T>[];
  emptyState?: ReactNode;
  caption?: ReactNode;
  toolbar?: ReactNode;
  /** Extension point for #68 mobile column collapse. Only `none` is implemented. */
  mobileColumnPolicy?: DataTableMobileColumnPolicy;
}

export default function DataTable<T>({
  rows,
  rowKey,
  nameColumn,
  columns,
  emptyState,
  caption,
  toolbar,
}: DataTableProps<T>) {
  const colSpan = columns.length + 1;
  const defaultEmpty = <EmptyState message="No items" />;

  return (
    <Stack gap="sm">
      {toolbar}
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{nameColumn.header ?? 'Name'}</Table.Th>
              {columns.map((col) => (
                <Table.Th key={col.key}>{col.header}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={colSpan}>{emptyState ?? defaultEmpty}</Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row) => (
                <Table.Tr key={rowKey(row)}>
                  <Table.Td>
                    <Anchor component={Link} to={nameColumn.getPath(row)} fw={500}>
                      {nameColumn.getName(row)}
                    </Anchor>
                  </Table.Td>
                  {columns.map((col) => (
                    <Table.Td key={col.key}>{col.render(row)}</Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      {caption ? (
        typeof caption === 'string' ? (
          <Text size="sm" c="dimmed">
            {caption}
          </Text>
        ) : (
          caption
        )
      ) : null}
    </Stack>
  );
}
