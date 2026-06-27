import { Button, Group, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import TargetRadiosEditor from '../TargetRadiosEditor/TargetRadiosEditor.tsx';
import { getHelpShort } from '../../content/help/manifest.ts';
import { hasValidationErrors } from '../../lib/validation/channel.ts';
import {
  sanitizeProjectMetadataPatch,
  validateProjectMetadata,
  type ProjectMetadataPatch,
} from '../../lib/validation/project.ts';
import type { CodeplugProject } from '../../models/codeplugProject.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';

export type ProjectMetadataFormValues = Pick<
  CodeplugProject,
  'name' | 'description' | 'notes' | 'author' | 'targetRadios'
>;

export default function ProjectMetadataForm({
  initialValues,
  submitLabel,
  onSubmit,
  cancelHref,
  cancelLabel = 'Cancel',
  autoFocusName = false,
}: {
  initialValues: ProjectMetadataFormValues;
  submitLabel: string;
  onSubmit: (patch: ProjectMetadataPatch) => void;
  cancelHref: string;
  cancelLabel?: string;
  autoFocusName?: boolean;
}) {
  const [values, setValues] = useState<ProjectMetadataFormValues>(() => ({
    ...initialValues,
    targetRadios: [...initialValues.targetRadios],
  }));
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof ProjectMetadataFormValues>(
    key: K,
    value: ProjectMetadataFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const patch = sanitizeProjectMetadataPatch(values);
    const issues = validateProjectMetadata({
      name: patch.name ?? '',
      description: patch.description,
      notes: patch.notes,
      author: patch.author,
      targetRadios: patch.targetRadios,
    });

    if (hasValidationErrors(issues)) {
      setFormError(issues.find((i) => i.severity === 'error')?.message ?? 'Validation failed');
      return;
    }

    onSubmit(patch);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        {formError ? (
          <Text c="red" size="sm">
            {formError}
          </Text>
        ) : null}

        <TextInput
          label="Name"
          required
          autoFocus={autoFocusName}
          value={values.name}
          onChange={(e) => set('name', e.currentTarget.value)}
        />
        <TextInput
          label="Description"
          description={getHelpShort('project.metadata')}
          value={values.description}
          onChange={(e) => set('description', e.currentTarget.value)}
        />
        <TextInput
          label="Author"
          description="Who created or maintains this layout"
          value={values.author}
          onChange={(e) => set('author', e.currentTarget.value)}
        />
        <TargetRadiosEditor
          value={values.targetRadios}
          onChange={(targetRadios) => set('targetRadios', targetRadios)}
          description={getHelpShort('project.targetRadios')}
        />
        <Textarea
          label="Notes"
          description="Free-form notes about layout intent or pending changes"
          minRows={4}
          value={values.notes}
          onChange={(e) => set('notes', e.currentTarget.value)}
        />

        <Group>
          <Button
            type="submit"
            leftSection={<IconDeviceFloppy size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            {submitLabel}
          </Button>
          <Button component={Link} to={cancelHref} variant="default">
            {cancelLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
