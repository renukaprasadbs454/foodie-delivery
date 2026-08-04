'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-web';
import { useLoginMutation } from '@/api/endpoints/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setSession } from './authSlice';
import { isNonEmptyPassword, isValidAdminEmail } from './validation';

function loginErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Invalid email or password.';
    case 'ACCOUNT_DEACTIVATED':
      return 'This admin account is deactivated.';
    case 'RATE_LIMITED':
      return 'Too many sign-in attempts. Try again later.';
    case 'VALIDATION_FAILED':
      return 'Check email and password, then try again.';
    case 'NETWORK_ERROR':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Sign-in failed. Try again.';
  }
}

/**
 * P2-AUTH-04 Admin Login — UI-API AdminLogin.
 * Connected to BFF POST /api/auth/login (GAP-API-13 closed).
 */
export function AdminLoginForm() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_login_viewed');
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError(undefined);
    setPasswordError(undefined);
    setToast(null);

    if (!isConnected) {
      setToast({
        message: 'You are offline. Connect to attempt sign-in.',
        variant: 'error',
      });
      return;
    }

    let valid = true;
    if (!isValidAdminEmail(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }
    if (!isNonEmptyPassword(password)) {
      setPasswordError('Password is required.');
      valid = false;
    }
    if (!valid) return;

    trackAnalyticsEvent('login_submitted');
    trackAnalyticsEvent('admin_auth_attempted');

    try {
      const identity = await login({
        email: email.trim(),
        password,
        deviceInfo: 'Admin Panel',
      }).unwrap();

      dispatch(
        setSession({
          userId: identity.userId,
          role: identity.role,
          userType: 'ADMIN',
        }),
      );
      trackAnalyticsEvent('admin_auth_succeeded', { role: identity.role });
      router.replace('/');
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { code?: string } }).data?.code
          : undefined;
      setToast({
        message: loginErrorMessage(code),
        variant: 'error',
      });
      trackAnalyticsEvent('admin_auth_failed', { code: code ?? 'UNKNOWN' });
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: '100%',
        maxWidth: 400,
        display: 'grid',
        gap: tokens.spacing.lg,
        padding: tokens.spacing.xl,
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
      }}
      noValidate
    >
      <Text as="h1" variant="heading1">
        Admin Login
      </Text>
      <Text variant="body" color={tokens.color.textSecondary}>
        Sign in with your admin email and password. Session cookies are set by
        the Admin BFF and never exposed to client JavaScript.
      </Text>
      <TextInput
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errorText={emailError}
        aria-label="Email"
        disabled={isLoading}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        errorText={passwordError}
        aria-label="Password"
        disabled={isLoading}
      />
      <Button
        type="submit"
        label="Sign in"
        aria-label="Sign in"
        loading={isLoading}
        disabled={isLoading}
      />
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        aria-label="Login message"
        onClose={() => setToast(null)}
      />
    </form>
  );
}
