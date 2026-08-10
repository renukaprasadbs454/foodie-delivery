'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'foodie-shared-web';

/**
 * Direct Access Console — Auto-redirects to Dashboard without email/password login.
 */
export default function LoginPage() {
  const { tokens } = useTheme();
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: tokens.color.background,
        padding: tokens.spacing.xl,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', color: '#14532D', fontWeight: 700 }}>
        Entering Admin Console...
      </div>
    </main>
  );
}

