import { Anchor, ScrollArea, Table } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface EntityTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface EntityTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  nameColumn: {
    header?: string;
    getName: (row: T) => string;
    getPath: (row: T) => string;
  };
  columns: EntityTableColumn<T>[];
}

export default function EntityTable<T>({ rows, rowKey, nameColumn, columns }: EntityTableProps<T>) {
  return (
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
              <Table.Td colSpan={columns.length + 1}>No items</Table.Td>
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
  );
}
