import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReportPage from '../components/report/ReportPage.tsx';
import { findEntityById } from '../lib/reportLookup.ts';
import { hasValidationErrors } from '../lib/validation/channel.ts';
import { validateContact } from '../lib/validation/contact.ts';
import type { Contact } from '../models/codeplug.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

type FormValues = Pick<Contact, 'name' | 'number' | 'timeslotOverride'>;

function emptyForm(): FormValues {
  return { name: '', number: '', timeslotOverride: '' };
}

function contactToForm(contact: Contact): FormValues {
  return {
    name: contact.name,
    number: contact.number,
    timeslotOverride: contact.timeslotOverride,
  };
}

export default function ContactEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, addContact, updateContact } = useCodeplug();
  const isNew = id === undefined;
  const existing = !isNew && id ? findEntityById(codeplug.contacts, id) : null;

  const [values, setValues] = useState<FormValues>(
    existing ? contactToForm(existing) : emptyForm(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  if (!isNew && !existing) {
    return (
      <ReportPage title="Edit contact">
        <Text>Contact not found.</Text>
        <Button component={Link} to="/contacts" mt="md" variant="light">
          Back to contacts
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

    const issues = validateContact(input, codeplug, existing?.id);
    if (hasValidationErrors(issues)) {
      setFormError(issues.find((i) => i.severity === 'error')?.message ?? 'Validation failed');
      return;
    }

    if (isNew) {
      addContact(input);
      navigate('/contacts');
    } else if (existing) {
      updateContact(existing.id, input);
      navigate(`/contacts/${existing.id}`);
    }
  };

  return (
    <ReportPage title={isNew ? 'New contact' : `Edit ${existing?.name ?? 'contact'}`}>
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Button
            component={Link}
            to={isNew ? '/contacts' : `/contacts/${existing?.id}`}
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
              to={isNew ? '/contacts' : `/contacts/${existing?.id}`}
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
