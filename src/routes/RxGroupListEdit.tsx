import { Button, Stack, Text, TextInput } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RxGroupListMemberPicker from '../components/crud/RxGroupListMemberPicker.tsx';
import { FormPage, FormSection } from '../components/ui/index.ts';
import type { EntityRef } from '../models/codeplug.ts';
import { findEntityById } from '../lib/reportLookup.ts';
import { hasValidationErrors } from '../lib/validation/channel.ts';
import { validateRxGroupList } from '../lib/validation/rxGroupList.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

export default function RxGroupListEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, addRxGroupList, updateRxGroupList, setRxGroupListMembers } = useCodeplug();
  const isNew = id === undefined;
  const existing = !isNew && id ? findEntityById(codeplug.rxGroupLists, id) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [memberRefs, setMemberRefs] = useState<EntityRef[]>(existing?.memberRefs ?? []);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isNew && !existing) {
    return (
      <FormPage title="Edit RX group list">
        <Text>RX group list not found.</Text>
        <Button component={Link} to="/rx-group-lists" mt="md" variant="light">
          Back to RX group lists
        </Button>
      </FormPage>
    );
  }

  const cancelPath = isNew ? '/rx-group-lists' : `/rx-group-lists/${existing?.id}`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const input = { name: name.trim(), memberRefs };
    const issues = validateRxGroupList(input, codeplug, existing?.id);
    if (hasValidationErrors(issues)) {
      setFormError(issues.find((i) => i.severity === 'error')?.message ?? 'Validation failed');
      return;
    }

    try {
      if (isNew) {
        addRxGroupList(input);
        navigate('/rx-group-lists');
      } else if (existing) {
        if (name.trim() !== existing.name) {
          updateRxGroupList(existing.id, { name: name.trim() });
        }
        setRxGroupListMembers(existing.id, memberRefs);
        navigate(`/rx-group-lists/${existing.id}`);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <FormPage
      title={isNew ? 'New RX group list' : `Edit ${existing?.name ?? 'list'}`}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button component={Link} to={cancelPath} variant="default">
            Cancel
          </Button>
          <Button
            type="submit"
            leftSection={<IconDeviceFloppy size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            Save
          </Button>
        </>
      }
    >
      <Stack gap="lg">
        <Button
          component={Link}
          to={cancelPath}
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

        <FormSection title="List details">
          <TextInput
            label="List name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
        </FormSection>

        <FormSection title="Members">
          <RxGroupListMemberPicker
            talkGroups={codeplug.talkGroups}
            contacts={codeplug.contacts}
            selectedRefs={memberRefs}
            onChange={setMemberRefs}
          />
        </FormSection>
      </Stack>
    </FormPage>
  );
}
