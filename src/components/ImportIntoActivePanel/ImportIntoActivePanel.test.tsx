import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { vendorFormatById } from '../../lib/vendorFormats.ts';
import ImportIntoActivePanel from './ImportIntoActivePanel.tsx';
import { channelsOnlyBundle } from '../../test/opengd77/loadFixture.ts';
import { newProject } from '../../models/codeplugProject.ts';
import { CODEPLUG_STORAGE_KEY, serializeProjects } from '../../state/codeplugStorage.ts';
import { CodeplugProvider } from '../../state/codeplugStore.tsx';
import { OperatorPositionProvider } from '../../state/operatorPosition.tsx';
import { theme } from '../../theme.ts';

const opengd77Format = vendorFormatById('opengd77');

function renderPanel(vendorFormat = opengd77Format) {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter>
        <OperatorPositionProvider>
          <CodeplugProvider>
            <ImportIntoActivePanel vendorFormat={vendorFormat} />
          </CodeplugProvider>
        </OperatorPositionProvider>
      </MemoryRouter>
    </MantineProvider>,
  );
}

function seedActiveProject() {
  const project = newProject('Test');
  localStorage.setItem(
    CODEPLUG_STORAGE_KEY,
    serializeProjects({ activeProjectId: project.id, projects: [project] }),
  );
}

describe('ImportIntoActivePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    seedActiveProject();
    let n = 0;
    vi.stubGlobal('crypto', {
      ...globalThis.crypto,
      randomUUID: () => `ui-${++n}`,
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('shows coming soon for planned vendor formats', () => {
    renderPanel(vendorFormatById('qdmr'));
    expect(screen.getByText(/Import not available yet/i)).toBeInTheDocument();
    expect(screen.queryByText('Merge')).not.toBeInTheDocument();
  });

  it('renders merge and overwrite mode selector', () => {
    renderPanel();
    expect(screen.getByText('Merge')).toBeInTheDocument();
    expect(screen.getByText('Overwrite')).toBeInTheDocument();
  });

  it('opens confirm modal after file parse with merge preview', async () => {
    renderPanel();
    const input = document.querySelector(
      'input[type="file"]:not([webkitdirectory])',
    ) as HTMLInputElement;
    const file = new File([channelsOnlyBundle['Channels.csv']], 'Channels.csv', {
      type: 'text/csv',
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /Import into active codeplug \(Merge\)/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Channels: 2 added/i)).toBeInTheDocument();
  });

  it('applies import on confirm', async () => {
    renderPanel();
    const input = document.querySelector(
      'input[type="file"]:not([webkitdirectory])',
    ) as HTMLInputElement;
    const file = new File([channelsOnlyBundle['Channels.csv']], 'Channels.csv', {
      type: 'text/csv',
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply import/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Apply import/i }));

    await waitFor(() => {
      expect(screen.getByText(/Import applied:/i)).toBeInTheDocument();
    });
  });

  it('shows no-changes message on idempotent re-import', async () => {
    renderPanel();
    const input = document.querySelector(
      'input[type="file"]:not([webkitdirectory])',
    ) as HTMLInputElement;
    const file = new File([channelsOnlyBundle['Channels.csv']], 'Channels.csv', {
      type: 'text/csv',
    });

    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => screen.getByRole('button', { name: /Apply import/i }));
    fireEvent.click(screen.getByRole('button', { name: /Apply import/i }));

    await waitFor(() => screen.getByText(/Import applied:/i));

    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/No changes — codeplug already matches import/i)).toBeInTheDocument();
    });
  });

  it('cancel leaves codeplug unchanged', async () => {
    renderPanel();
    const input = document.querySelector(
      'input[type="file"]:not([webkitdirectory])',
    ) as HTMLInputElement;
    const file = new File([channelsOnlyBundle['Channels.csv']], 'Channels.csv', {
      type: 'text/csv',
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => screen.getByRole('button', { name: /Cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/Import applied:/i)).not.toBeInTheDocument();
  });
});
