import React, { type ReactNode, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  'aria-label': string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  'aria-label': ariaLabel,
}: ModalProps) {
  const { tokens } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: tokens.color.overlay,
        display: 'grid',
        placeItems: 'center',
        padding: tokens.spacing.lg,
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
        style={{
          background: tokens.color.background,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.lg,
          minWidth: 320,
          maxWidth: 560,
          display: 'grid',
          gap: tokens.spacing.md,
        }}
      >
        {title ? <Text as="h2" variant="heading2">{title}</Text> : null}
        {children}
      </div>
    </div>
  );
}
