import { Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ZoneMemberPicker from '../../components/crud/ZoneMemberPicker.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { findEntityById } from '../../lib/reportLookup.ts';
import { hasValidationErrors } from '../../lib/validation/channel.ts';
import { validateZone } from '../../lib/validation/zone.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

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
      <ReportPage title="Edit zone">
        <Text>Zone not found.</Text>
        <Button component={Link} to="/zones" mt="md" variant="light">
          Back to zones
        </Button>
      </ReportPage>
    );
  }

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
    <ReportPage title={isNew ? 'New zone' : `Edit ${existing?.name ?? 'zone'}`}>
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Button
            component={Link}
            to={isNew ? '/zones' : `/zones/${existing?.id}`}
            variant="subtle"
            size="compact-sm"
            style={{ alignSelf: 'flex-start' }}
          >
            ← Back
          </Button>

          {formError ? (
            <Text c="red" size="sm">
              {formError}
            </Text>
          ) : null}

          <TextInput
            label="Zone name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />

          <Stack gap="sm">
            <Title order={4}>Member channels</Title>
            <ZoneMemberPicker
              channels={codeplug.channels}
              selectedIds={memberIds}
              onChange={setMemberIds}
            />
          </Stack>

          <Group>
            <Button type="submit">Save</Button>
            <Button
              variant="default"
              component={Link}
              to={isNew ? '/zones' : `/zones/${existing?.id}`}
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </ReportPage>
  );
}
