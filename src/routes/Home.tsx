import { Button } from '@mantine/core';
import { IconFilePlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import ImportNewProjectPanel from '../components/ImportNewProjectPanel/ImportNewProjectPanel.tsx';
import { HelpAlert } from '../components/help/index.ts';
import ProjectList from '../components/ProjectList/ProjectList.tsx';
import { Page, PageHeader, PageSection } from '../components/ui/index.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';
import { useProjects } from '../state/codeplugStore.tsx';

export default function Home() {
  const navigate = useNavigate();
  const { projects, importNewProject, persistenceError, clearPersistenceError } = useProjects();

  return (
    <Page width="narrow">
      <PageHeader
        title="MM9PDY Codeplug Tool"
        description="Your codeplugs are stored in this browser. Import a CPS export, start a blank codeplug, or open an existing one below."
      />
      <HelpAlert helpId="gettingStarted.privacy" />

      {projects.length > 0 ? (
        <PageSection title="Your codeplugs">
          <ProjectList />
        </PageSection>
      ) : null}

      <PageSection
        title={projects.length ? 'Start another codeplug' : 'Start fresh'}
        description="Build a new layout from scratch — channels, zones, and contacts added after you save."
      >
        <Button
          variant="light"
          leftSection={<IconFilePlus size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          onClick={() => navigate('/codeplug/new')}
          style={{ alignSelf: 'flex-start' }}
        >
          Start fresh
        </Button>
      </PageSection>

      <PageSection
        title={projects.length ? 'Import another codeplug' : 'Import codeplug'}
        description={
          projects.length === 0
            ? 'Choose a vendor format, then drop CPS export files or a folder. Files stay on your machine.'
            : 'Import creates a new codeplug and opens the summary.'
        }
      >
        <ImportNewProjectPanel
          onImported={(result) => {
            importNewProject(result);
            navigate('/summary');
          }}
          persistenceError={persistenceError}
          onDismissPersistenceError={clearPersistenceError}
        />
      </PageSection>
    </Page>
  );
}
