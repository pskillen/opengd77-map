import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import DataTable from './DataTable.tsx';
import { DATATABLE_CALLSIGN_SORT_KEY, DATATABLE_NAME_SORT_KEY } from '../../lib/dataTable/sort.ts';
import { theme } from '../../theme.ts';

interface Row {
  id: string;
  name: string;
  score: number;
}

const SAMPLE_ROWS: Row[] = [
  { id: '1', name: 'Zulu', score: 10 },
  { id: '2', name: 'Alpha', score: 3 },
  { id: '3', name: 'Mike', score: 7 },
];

function renderTable(
  props: Partial<ComponentProps<typeof DataTable<Row>>> & { rows?: Row[] } = {},
) {
  const { rows = SAMPLE_ROWS, ...rest } = props;
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter>
        <DataTable
          rows={rows}
          rowKey={(row) => row.id}
          nameColumn={{
            getName: (row) => row.name,
            getPath: (row) => `/items/${row.id}`,
          }}
          columns={[
            {
              key: 'score',
              header: 'Score',
              render: (row) => row.score,
              sortable: true,
              sortValue: (row) => row.score,
            },
          ]}
          {...rest}
        />
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('DataTable', () => {
  it('renders column headers and empty state when rows are empty', () => {
    renderTable({ rows: [] });
    expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Score/i })).toBeInTheDocument();
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders row links when data is present', () => {
    renderTable();
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/items/2');
  });

  it('sorts rows when header is clicked', () => {
    renderTable();
    const nameHeader = screen.getByRole('button', { name: /Name/i });
    fireEvent.click(nameHeader);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent('Alpha');
    expect(links[2]).toHaveTextContent('Zulu');
  });

  it('renders sticky header region', () => {
    renderTable();
    expect(screen.getByTestId('datatable-thead')).toBeInTheDocument();
    expect(screen.getByTestId('datatable-scroll')).toBeInTheDocument();
  });

  it('hides hideable columns based on visibility', () => {
    renderTable({
      columns: [
        {
          key: 'score',
          header: 'Score',
          render: (row) => row.score,
          sortValue: (row) => row.score,
          hideable: true,
          defaultVisible: false,
        },
        {
          key: 'extra',
          header: 'Extra',
          render: () => 'x',
          hideable: true,
          defaultVisible: true,
        },
      ],
      columnVisibility: ['extra'],
    });
    expect(screen.queryByRole('columnheader', { name: 'Score' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Extra' })).toBeInTheDocument();
  });

  it('hides all hideable columns when visibility is empty', () => {
    renderTable({
      columns: [
        {
          key: 'score',
          header: 'Score',
          render: (row) => row.score,
          sortValue: (row) => row.score,
          hideable: true,
          defaultVisible: true,
        },
      ],
      columnVisibility: [],
    });
    expect(screen.queryByRole('columnheader', { name: 'Score' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument();
  });

  it('calls onSelectedKeysChange when row checkbox toggled', () => {
    const onSelectedKeysChange = vi.fn();
    renderTable({ selectable: true, selectedKeys: [], onSelectedKeysChange });
    fireEvent.click(screen.getByRole('checkbox', { name: /Select row Alpha/i }));
    expect(onSelectedKeysChange).toHaveBeenCalledWith(['2']);
  });

  it('shows filtered empty message when totalRowCount > 0', () => {
    renderTable({ rows: [], totalRowCount: 5, filteredEmptyMessage: 'No matches' });
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('renders search input when showSearch is true', () => {
    renderTable({ showSearch: true, search: 'alpha', onSearchChange: vi.fn() });
    expect(screen.getByRole('textbox', { name: 'Search table' })).toHaveValue('alpha');
  });

  it('requests desc when controlled sort header is clicked again', () => {
    const onSortChange = vi.fn();
    renderTable({
      sort: { columnKey: DATATABLE_NAME_SORT_KEY, direction: 'asc' },
      onSortChange,
    });
    fireEvent.click(screen.getByRole('button', { name: /Name/i }));
    expect(onSortChange).toHaveBeenCalledWith({
      columnKey: DATATABLE_NAME_SORT_KEY,
      direction: 'desc',
    });
  });

  it('sorts by callsign when callsign header is clicked', () => {
    const onSortChange = vi.fn();
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <MemoryRouter>
          <DataTable
            rows={SAMPLE_ROWS}
            rowKey={(row) => row.id}
            callsignColumn={{
              getName: (row) => row.name.slice(0, 3),
              getPath: (row) => `/items/${row.id}`,
              sortValue: (row) => row.name.slice(0, 3),
            }}
            nameColumn={{
              getName: (row) => row.name,
              getPath: (row) => `/items/${row.id}`,
            }}
            columns={[]}
            sort={{ columnKey: DATATABLE_NAME_SORT_KEY, direction: 'asc' }}
            onSortChange={onSortChange}
          />
        </MemoryRouter>
      </MantineProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Callsign/i }));
    expect(onSortChange).toHaveBeenCalledWith({
      columnKey: DATATABLE_CALLSIGN_SORT_KEY,
      direction: 'asc',
    });
  });
});
