'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-web';
import {
  ADMIN_LOGIN_GAP_MESSAGE,
  GAP_API_13_ADMIN_LOGIN,
} from '@/constants/gaps';
import { isNonEmptyPassword, isValidAdminEmail } from './validation';

/**
 * P2-AUTH-04 Admin Login — UI-API AdminLogin.
 * Fail-closed Partial: form validates locally then blocks submit (GAP-API-13).
 * Never invents Admin login API; never uses Customer OTP/Google.
 */
export function AdminLoginForm() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'error' | 'info';
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackAnalyticsEvent('admin_login_viewed');
  }, []);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError(undefined);
    setPasswordError(undefined);

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

    setSubmitting(true);
    trackAnalyticsEvent('login_submitted');
    trackAnalyticsEvent('admin_auth_attempted', {
      gapId: GAP_API_13_ADMIN_LOGIN,
    });

    // Fail-closed: no network call to an invented login endpoint.
    setToast({
      message: ADMIN_LOGIN_GAP_MESSAGE,
      variant: 'error',
    });
    setSubmitting(false);
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
        Email and password UI only. Backend Admin login is Gap-blocked (
        {GAP_API_13_ADMIN_LOGIN}). Session refresh uses the existing BFF cookie
        path when cookies are already present.
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
        disabled={submitting}
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
        disabled={submitting}
      />
      <Button
        type="submit"
        label="Sign in"
        aria-label="Sign in"
        loading={submitting}
        disabled={submitting}
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
