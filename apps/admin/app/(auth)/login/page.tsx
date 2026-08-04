'use client';

import { useTheme } from 'foodie-shared-web';
import { AdminLoginForm } from '@/features/auth/AdminLoginForm';

/**
 * P2-AUTH-04 — AdminLogin route `/login` (UI-API).
 * Fail-closed Gap shell with local form UX; no invented login API.
 */
export default function LoginPage() {
  const { tokens } = useTheme();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: tokens.color.background,
        padding: tokens.spacing.xl,
      }}
    >
      <AdminLoginForm />
    </main>
  );
}
