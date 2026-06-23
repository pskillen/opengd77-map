import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DataTable from './DataTable.tsx';
import { theme } from '../../theme.ts';

function renderTable(rows: { id: string; name: string }[]) {
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
          columns={[{ key: 'extra', header: 'Extra', render: () => '—' }]}
        />
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('DataTable', () => {
  it('renders column headers and empty state when rows are empty', () => {
    renderTable([]);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Extra' })).toBeInTheDocument();
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders row links when data is present', () => {
    renderTable([{ id: '1', name: 'Alpha' }]);
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/items/1');
  });
});
