import { Button, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import ProjectMetadataForm, {
  type ProjectMetadataFormValues,
} from '../../components/ProjectMetadataForm/ProjectMetadataForm.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import type { CodeplugProject } from '../../models/codeplugProject.ts';
import { useProjects } from '../../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';

function projectToForm(project: CodeplugProject): ProjectMetadataFormValues {
  return {
    name: project.name,
    description: project.description,
    notes: project.notes,
    author: project.author,
    targetRadios: [...project.targetRadios],
  };
}

export default function ProjectEdit() {
  const navigate = useNavigate();
  const { activeProject, updateProject } = useProjects();

  if (!activeProject) {
    return <Navigate to="/" replace />;
  }

  return (
    <ReportPage title="Edit project">
      <Stack gap="lg">
        <Button
          component={Link}
          to="/summary"
          variant="subtle"
          size="compact-sm"
          style={{ alignSelf: 'flex-start' }}
          leftSection={<IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        >
          Back to summary
        </Button>

        <ProjectMetadataForm
          key={activeProject.id}
          initialValues={projectToForm(activeProject)}
          submitLabel="Save"
          cancelHref="/summary"
          onSubmit={(patch) => {
            updateProject(activeProject.id, patch);
            navigate('/summary');
          }}
        />
      </Stack>
    </ReportPage>
  );
}
