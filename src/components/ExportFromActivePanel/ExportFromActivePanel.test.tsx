import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { vendorFormatById } from '../../lib/vendorFormats.ts';
import ExportFromActivePanel from './ExportFromActivePanel.tsx';
import { newProject } from '../../models/codeplugProject.ts';
import { CODEPLUG_STORAGE_KEY, serializeProjects } from '../../state/codeplugStorage.ts';
import { CodeplugProvider } from '../../state/codeplugStore.tsx';
import { OperatorPositionProvider } from '../../state/operatorPosition.tsx';
import { theme } from '../../theme.ts';

function renderPanel(vendorFormat = vendorFormatById('opengd77')) {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter>
        <OperatorPositionProvider>
          <CodeplugProvider>
            <ExportFromActivePanel vendorFormat={vendorFormat} />
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

describe('ExportFromActivePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    seedActiveProject();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('shows coming soon for planned vendor formats', () => {
    renderPanel(vendorFormatById('qdmr'));
    expect(screen.getByText(/Export not available yet/i)).toBeInTheDocument();
  });

  it('renders OpenGD77 multi-file download buttons', () => {
    renderPanel(vendorFormatById('opengd77'));
    expect(screen.getByRole('button', { name: /Download Channels\.csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download all/i })).toBeInTheDocument();
  });

  it('hides multi-talkgroup export options on OpenGD77 export', () => {
    renderPanel(vendorFormatById('opengd77'));
    expect(screen.queryByText('Multi-talkgroup export name style')).not.toBeInTheDocument();
    expect(screen.queryByText('Use talk group abbreviations')).not.toBeInTheDocument();
  });

  it('hides multi-talkgroup export options on CHIRP export', () => {
    renderPanel(vendorFormatById('chirp'));
    expect(screen.queryByText('Multi-talkgroup export name style')).not.toBeInTheDocument();
    expect(screen.queryByText('Use talk group abbreviations')).not.toBeInTheDocument();
  });

  it('shows multi-talkgroup export options on DM32 export', () => {
    renderPanel(vendorFormatById('dm32'));
    expect(screen.getByText('Multi-talkgroup export name style')).toBeInTheDocument();
    expect(screen.getByText('Use talk group abbreviations')).toBeInTheDocument();
  });

  it('renders CHIRP profile picker and single download', () => {
    renderPanel(vendorFormatById('chirp'));
    expect(screen.getByRole('combobox', { name: 'Radio profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Export$/i })).toBeInTheDocument();
    expect(screen.getByText(/Only analogue FM\/AM channels/i)).toBeInTheDocument();
  });
});
