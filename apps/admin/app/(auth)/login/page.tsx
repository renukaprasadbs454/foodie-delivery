'use client';

import { useTheme } from 'foodie-shared-web';
import { AdminLoginForm } from '@/features/auth/AdminLoginForm';

/**
 * P2-AUTH-04 — AdminLogin route `/login` (UI-API).
 * Connected to BFF login (GAP-API-13 resolved).
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
