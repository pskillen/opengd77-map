import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export interface ConfirmDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  entityName: string;
  warning?: string;
}

export default function ConfirmDeleteModal({
  opened,
  onClose,
  onConfirm,
  title,
  entityName,
  warning,
}: ConfirmDeleteModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Stack gap="md">
        <Text size="sm">
          Delete <strong>{entityName}</strong>? This cannot be undone.
        </Text>
        {warning ? (
          <Text size="sm" c="orange">
            {warning}
          </Text>
        ) : null}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
