'use client';

import React, { useState } from 'react';
import { Button, Modal, Text, TextInput, useTheme } from 'foodie-shared-web';
import { validateSuspendReason } from '../types';

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

/** Suspend reason modal — reason required ≤500. */
export function SuspendReasonModal({
  open,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const { tokens } = useTheme();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    const validated = validateSuspendReason(reason);
    if (!validated.ok) {
      setError(validated.message);
      return;
    }
    setError(undefined);
    onConfirm(validated.reason);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suspend restaurant?"
      aria-label="Suspend restaurant"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
        <Text as="p" variant="body">
          Provide a reason (required, max 500 characters). Suspended restaurants
          are hidden from public listing.
        </Text>
        <TextInput
          label="Reason"
          name="suspendReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          errorText={error}
          aria-label="Suspend reason"
          disabled={loading}
        />
        <Button
          label="Suspend"
          aria-label="Confirm suspend"
          variant="danger"
          loading={loading}
          disabled={loading}
          onClick={submit}
        />
        <Button
          label="Cancel"
          aria-label="Cancel suspend"
          variant="secondary"
          disabled={loading}
          onClick={onClose}
        />
      </div>
    </Modal>
  );
}
