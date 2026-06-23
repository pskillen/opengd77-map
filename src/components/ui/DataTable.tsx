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

export interface DataTableLinkedColumn<T> {
  header?: string;
  getName: (row: T) => string;
  getPath: (row: T) => string;
}

export interface DataTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  /** Optional leading linked column (e.g. callsign before name). */
  callsignColumn?: DataTableLinkedColumn<T>;
  nameColumn: DataTableLinkedColumn<T>;
  columns: DataTableColumn<T>[];
  emptyState?: ReactNode;
  caption?: ReactNode;
  toolbar?: ReactNode;
  /** Extension point for #68 mobile column collapse. Only `none` is implemented. */
  mobileColumnPolicy?: DataTableMobileColumnPolicy;
}

function LinkedCell<T>({ column, row }: { column: DataTableLinkedColumn<T>; row: T }) {
  return (
    <Anchor component={Link} to={column.getPath(row)} fw={500}>
      {column.getName(row)}
    </Anchor>
  );
}

export default function DataTable<T>({
  rows,
  rowKey,
  callsignColumn,
  nameColumn,
  columns,
  emptyState,
  caption,
  toolbar,
}: DataTableProps<T>) {
  const leadingColCount = (callsignColumn ? 1 : 0) + 1;
  const colSpan = columns.length + leadingColCount;
  const defaultEmpty = <EmptyState message="No items" />;

  return (
    <Stack gap="sm">
      {toolbar}
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              {callsignColumn ? <Table.Th>{callsignColumn.header ?? 'Callsign'}</Table.Th> : null}
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
                  {callsignColumn ? (
                    <Table.Td>
                      <LinkedCell column={callsignColumn} row={row} />
                    </Table.Td>
                  ) : null}
                  <Table.Td>
                    <LinkedCell column={nameColumn} row={row} />
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
