import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReportPage from '../components/report/ReportPage.tsx';
import { findEntityById } from '../lib/reportLookup.ts';
import { hasValidationErrors } from '../lib/validation/channel.ts';
import { validateTalkGroup } from '../lib/validation/talkGroup.ts';
import type { TalkGroup } from '../models/codeplug.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

type FormValues = Pick<TalkGroup, 'name' | 'number' | 'timeslotOverride'>;

function emptyForm(): FormValues {
  return { name: '', number: '', timeslotOverride: '' };
}

function talkGroupToForm(tg: TalkGroup): FormValues {
  return {
    name: tg.name,
    number: tg.number,
    timeslotOverride: tg.timeslotOverride,
  };
}

export default function TalkGroupEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, addTalkGroup, updateTalkGroup } = useCodeplug();
  const isNew = id === undefined;
  const existing = !isNew && id ? findEntityById(codeplug.talkGroups, id) : null;

  const [values, setValues] = useState<FormValues>(
    existing ? talkGroupToForm(existing) : emptyForm(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  if (!isNew && !existing) {
    return (
      <ReportPage title="Edit talk group">
        <Text>Talk group not found.</Text>
        <Button component={Link} to="/talk-groups" mt="md" variant="light">
          Back to talk groups
        </Button>
      </ReportPage>
    );
  }

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const input = {
      name: values.name.trim(),
      number: values.number.trim(),
      timeslotOverride: values.timeslotOverride.trim(),
    };

    const issues = validateTalkGroup(input, codeplug, existing?.id);
    if (hasValidationErrors(issues)) {
      setFormError(issues.find((i) => i.severity === 'error')?.message ?? 'Validation failed');
      return;
    }

    if (isNew) {
      addTalkGroup(input);
      navigate('/talk-groups');
    } else if (existing) {
      updateTalkGroup(existing.id, input);
      navigate(`/talk-groups/${existing.id}`);
    }
  };

  return (
    <ReportPage title={isNew ? 'New talk group' : `Edit ${existing?.name ?? 'talk group'}`}>
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Button
            component={Link}
            to={isNew ? '/talk-groups' : `/talk-groups/${existing?.id}`}
            variant="subtle"
            size="compact-sm"
            style={{ alignSelf: 'flex-start' }}
            leftSection={<IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            Back
          </Button>

          {formError ? (
            <Text c="red" size="sm">
              {formError}
            </Text>
          ) : null}

          <TextInput
            label="Name"
            required
            value={values.name}
            onChange={(e) => set('name', e.currentTarget.value)}
          />
          <TextInput
            label="DMR ID"
            value={values.number}
            onChange={(e) => set('number', e.currentTarget.value)}
          />
          <TextInput
            label="Timeslot override"
            description="Optional slot hint for vendor export"
            value={values.timeslotOverride}
            onChange={(e) => set('timeslotOverride', e.currentTarget.value)}
          />

          <Group>
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            >
              Save
            </Button>
            <Button
              component={Link}
              to={isNew ? '/talk-groups' : `/talk-groups/${existing?.id}`}
              variant="default"
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </ReportPage>
  );
}
