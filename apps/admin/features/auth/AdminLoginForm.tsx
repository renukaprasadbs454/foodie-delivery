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
      return 'Invalid email or password. Please check your credentials.';
    case 'ACCOUNT_DEACTIVATED':
      return 'This admin account is deactivated. Contact system administrator.';
    case 'RATE_LIMITED':
      return 'Too many sign-in attempts. Please try again after a few minutes.';
    case 'VALIDATION_FAILED':
      return 'Please check email and password formatting, then try again.';
    case 'NETWORK_ERROR':
      return 'Network connection error. Check your network and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

interface AdminLoginFormProps {
  initialEmail?: string;
  initialPassword?: string;
}

/**
 * P2-AUTH-04 Admin Login — UI-API AdminLogin.
 * Connected to BFF POST /api/auth/login (GAP-API-13 closed).
 */
export function AdminLoginForm({
  initialEmail = 'admin@foodie.local',
  initialPassword = 'ChangeMe@123',
}: AdminLoginFormProps) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_login_viewed');
  }, []);

  const handleFillDemo = () => {
    setEmail('admin@foodie.local');
    setPassword('ChangeMe@123');
    setEmailError(undefined);
    setPasswordError(undefined);
    setToast({
      message: 'Demo credentials filled (admin@foodie.local / ChangeMe@123)',
      variant: 'info',
    });
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError(undefined);
    setPasswordError(undefined);
    setToast(null);

    if (!isConnected) {
      setToast({
        message: 'You are offline. Connect to internet to attempt sign-in.',
        variant: 'error',
      });
      return;
    }

    let valid = true;
    if (!isValidAdminEmail(email)) {
      setEmailError('Enter a valid admin email address (e.g. admin@foodie.local).');
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
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
      noValidate
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Text as="h1" variant="heading1" style={{ fontSize: 24, fontWeight: 800, color: '#0F3D21' }}>
          Sign In to Admin Panel
        </Text>
        <Text variant="body" color={tokens.color.textSecondary} style={{ fontSize: 13, lineHeight: 1.5 }}>
          Enter your executive credentials to access platform operations, revenue analytics, and system governance.
        </Text>
      </div>

      {/* Demo Credentials Helper Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 10,
          fontSize: 12,
          color: '#166534',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔑</span>
          <span>
            Demo Admin: <strong>admin@foodie.local</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleFillDemo}
          style={{
            background: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
          }}
        >
          Auto-fill
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextInput
          label="Admin Email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@foodie.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          errorText={emailError}
          aria-label="Email"
          disabled={isLoading}
        />

        <div style={{ position: 'relative' }}>
          <TextInput
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorText={passwordError}
            aria-label="Password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{
              position: 'absolute',
              right: 12,
              top: 36,
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        label={isLoading ? 'Authenticating...' : 'Sign in to Dashboard ➔'}
        aria-label="Sign in"
        loading={isLoading}
        disabled={isLoading}
        style={{
          marginTop: 4,
          padding: '12px 20px',
          backgroundColor: '#0F3D21',
          color: '#FFFFFF',
          borderRadius: 10,
          fontWeight: 800,
          fontSize: 14,
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, color: '#64748B' }}>
        <span>🔒 256-bit Encrypted Session</span>
        <span>•</span>
        <span>httpOnly Cookies</span>
      </div>

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

