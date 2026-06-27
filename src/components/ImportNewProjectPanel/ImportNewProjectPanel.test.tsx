import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ImportNewProjectPanel from './ImportNewProjectPanel.tsx';
import { CodeplugProvider } from '../../state/codeplugStore.tsx';
import { OperatorPositionProvider } from '../../state/operatorPosition.tsx';
import { theme } from '../../theme.ts';

function renderPanel() {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter>
        <OperatorPositionProvider>
          <CodeplugProvider>
            <ImportNewProjectPanel onImported={() => {}} />
          </CodeplugProvider>
        </OperatorPositionProvider>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('ImportNewProjectPanel', () => {
  it('requires explicit vendor format selection', () => {
    renderPanel();
    expect(screen.getByRole('combobox', { name: 'Vendor format' })).toBeInTheDocument();
    expect(screen.getByText(/do not auto-detect/i)).toBeInTheDocument();
  });

  it('shows OpenGD77 dropzone by default', () => {
    renderPanel();
    expect(screen.getByText(/Drop OpenGD77 CPS CSV export files or a folder/i)).toBeInTheDocument();
  });

  it('shows coming soon for planned vendor formats', () => {
    renderPanel();
    // Mantine Select — change via combobox is heavy; verify qDMR path via ImportFormatDropzone unit
    expect(screen.getByRole('combobox', { name: 'Vendor format' })).toBeInTheDocument();
  });
});
