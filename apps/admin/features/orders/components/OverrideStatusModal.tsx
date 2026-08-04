'use client';

import React, { useState } from 'react';
import { Button, Modal, Text, TextInput, useTheme } from 'foodie-shared-web';
import { ORDER_STATUSES, validateOverrideBody } from '../types';

type Props = {
  open: boolean;
  loading?: boolean;
  currentStatus?: string;
  onClose: () => void;
  onConfirm: (targetStatus: string, reason: string) => void;
};

/** Admin override status modal — targetStatus + reason ≤500. */
export function OverrideStatusModal({
  open,
  loading,
  currentStatus,
  onClose,
  onConfirm,
}: Props) {
  const { tokens } = useTheme();
  const [targetStatus, setTargetStatus] = useState<string>(ORDER_STATUSES[0]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    const validated = validateOverrideBody(targetStatus, reason);
    if (!validated.ok) {
      setError(validated.message);
      return;
    }
    setError(undefined);
    onConfirm(validated.body.targetStatus, validated.body.reason);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override order status?"
      aria-label="Override order status"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
        <Text as="p" variant="body">
          Current status: {currentStatus ?? '—'}. Reason is required (max 500).
        </Text>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text as="span" variant="label">
            Target status
          </Text>
          <select
            aria-label="Target status"
            value={targetStatus}
            disabled={loading}
            onChange={(e) => setTargetStatus(e.target.value)}
            style={{
              minHeight: 44,
              padding: `0 ${tokens.spacing.md}px`,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              background: tokens.color.surface,
            }}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Reason"
          name="overrideReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          errorText={error}
          aria-label="Override reason"
          disabled={loading}
        />
        <Button
          label="Submit override"
          aria-label="Submit order status override"
          loading={loading}
          disabled={loading}
          onClick={submit}
        />
        <Button
          label="Cancel"
          aria-label="Cancel override"
          variant="secondary"
          disabled={loading}
          onClick={onClose}
        />
      </div>
    </Modal>
  );
}
