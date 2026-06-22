import { Button, Stack, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import ProjectMetadataForm from '../../components/ProjectMetadataForm/ProjectMetadataForm.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { blankProjectMetadataFormValues } from '../../models/codeplugProject.ts';
import { useProjects } from '../../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';

export default function NewCodeplug() {
  const navigate = useNavigate();
  const { commitNewProject } = useProjects();

  return (
    <ReportPage title="New codeplug">
      <Stack gap="lg">
        <Button
          component={Link}
          to="/"
          variant="subtle"
          size="compact-sm"
          style={{ alignSelf: 'flex-start' }}
          leftSection={<IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        >
          Back to home
        </Button>

        <Text c="dimmed" size="sm">
          Create an empty codeplug layout. Add channels, zones, and contacts after you save.
        </Text>

        <ProjectMetadataForm
          initialValues={blankProjectMetadataFormValues()}
          submitLabel="Create"
          cancelHref="/"
          cancelLabel="Cancel"
          autoFocusName
          onSubmit={(patch) => {
            commitNewProject(patch);
            navigate('/summary');
          }}
        />
      </Stack>
    </ReportPage>
  );
}
