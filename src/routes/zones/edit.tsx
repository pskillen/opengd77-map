import { Button, Stack, Text, TextInput } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ZoneMemberPicker from '../../components/crud/ZoneMemberPicker.tsx';
import { FormPage, FormSection } from '../../components/ui/index.ts';
import { findEntityById } from '../../lib/reportLookup.ts';
import { hasValidationErrors } from '../../lib/validation/channel.ts';
import { validateZone } from '../../lib/validation/zone.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';

export default function ZoneEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, addZone, updateZone, setZoneMembers } = useCodeplug();
  const isNew = id === undefined;
  const existing = !isNew && id ? findEntityById(codeplug.zones, id) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [memberIds, setMemberIds] = useState<string[]>(existing?.memberChannelIds ?? []);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isNew && !existing) {
    return (
      <FormPage title="Edit zone">
        <Text>Zone not found.</Text>
        <Button component={Link} to="/zones" mt="md" variant="light">
          Back to zones
        </Button>
      </FormPage>
    );
  }

  const cancelPath = isNew ? '/zones' : `/zones/${existing?.id}`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const issues = validateZone({ name, memberChannelIds: memberIds }, codeplug, existing?.id);
    if (hasValidationErrors(issues)) {
      setFormError(issues.find((i) => i.severity === 'error')?.message ?? 'Validation failed');
      return;
    }

    try {
      if (isNew) {
        addZone({ name: name.trim(), memberChannelIds: memberIds });
        navigate('/zones');
      } else if (existing) {
        if (name.trim() !== existing.name) {
          updateZone(existing.id, { name: name.trim() });
        }
        setZoneMembers(existing.id, memberIds);
        navigate(`/zones/${existing.id}`);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <FormPage
      title={isNew ? 'New zone' : `Edit ${existing?.name ?? 'zone'}`}
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

        <FormSection title="Zone details">
          <TextInput
            label="Zone name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
        </FormSection>

        <FormSection title="Member channels">
          <ZoneMemberPicker
            channels={codeplug.channels}
            selectedIds={memberIds}
            onChange={setMemberIds}
          />
        </FormSection>
      </Stack>
    </FormPage>
  );
}
