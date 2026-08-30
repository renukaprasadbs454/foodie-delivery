'use client';

import React, { useState } from 'react';
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
import { getHomeRouteForRole } from '@/lib/routeGuards';

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
      return 'Network connection error or backend server offline. Try again.';
    default:
      return 'Sign-in failed. Please check your credentials and backend server connection.';
  }
}

interface AdminLoginFormProps {
  initialEmail?: string;
  initialPassword?: string;
}

export function AdminLoginForm({
  initialEmail = 'admin@foodie.local',
  initialPassword = 'ChangeMe@123',
}: AdminLoginFormProps) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [selectedRole, setSelectedRole] = useState<string>('SUPER_ADMIN');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'error' | 'info';
  } | null>(null);

  const ROLE_OPTIONS = [
    {
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
      email: 'admin@foodie.local',
      pass: 'ChangeMe@123',
    },
    {
      role: 'FINANCE_ADMIN',
      label: 'Finance Admin',
      email: 'Financeadmin@foodie.local',
      pass: 'FoodieMinister@111',
    },
    {
      role: 'OPERATIONS_ADMIN',
      label: 'Operations Admin',
      email: 'opsadmin@foodie.local',
      pass: 'FoodieOps@222',
    },
    {
      role: 'RESTAURANT_MANAGER',
      label: 'Restaurant Manager',
      email: 'manager@foodie.local',
      pass: 'FoodieManager@333',
    },
    {
      role: 'SUPPORT_AGENT',
      label: 'Support Agent',
      email: 'support@foodie.local',
      pass: 'FoodieSupport@444',
    },
    {
      role: 'AUDITOR',
      label: 'Compliance Auditor',
      email: 'auditor@foodie.local',
      pass: 'FoodieAuditor@555',
    },
    {
      role: 'DARKSTORE_ADMIN',
      label: 'Darkstore Admin',
      email: 'darkstore@foodie.local',
      pass: 'DarkstoreOps@123',
    },
  ];

  const handleRoleSelect = (roleKey: string) => {
    setSelectedRole(roleKey);
    const target = ROLE_OPTIONS.find((r) => r.role === roleKey);
    if (target) {
      setEmail(target.email);
      setPassword(target.pass);
      setEmailError(undefined);
      setPasswordError(undefined);
    }
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

      const backendRole = identity.role || selectedRole;

      dispatch(
        setSession({
          userId: identity.userId,
          role: backendRole as any,
          userType: 'ADMIN',
        }),
      );

      trackAnalyticsEvent('admin_auth_succeeded', { role: backendRole });
      const redirectPath = getHomeRouteForRole(backendRole);
      window.location.href = redirectPath;
    } catch (err: any) {
      trackAnalyticsEvent('admin_auth_failed');
      const errorCode = err?.data?.error?.code || err?.error;
      const message = err?.data?.error?.message || loginErrorMessage(errorCode);
      setToast({
        message,
        variant: 'error',
      });
    }
  };

  const currentRoleInfo = ROLE_OPTIONS.find((r) => r.role === selectedRole) || ROLE_OPTIONS[0];

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
          Select an admin role account below to auto-fill development credentials, or enter custom email & password.
        </Text>
      </div>

      {/* Role Selection Dropdown */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          backgroundColor: '#F8FAFC',
          padding: 16,
          borderRadius: 14,
          border: '1.5px solid #0F3D21',
          boxShadow: '0 2px 8px rgba(15, 61, 33, 0.06)',
        }}
      >
        <label
          htmlFor="admin-role-select"
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#0F3D21',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Select Admin Role Preset:
        </label>
        <select
          id="admin-role-select"
          value={selectedRole}
          onChange={(e) => handleRoleSelect(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '2px solid #10B981',
            backgroundColor: '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            color: '#0F3D21',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          {ROLE_OPTIONS.map((item) => (
            <option key={item.role} value={item.role}>
              {item.label} ({item.email})
            </option>
          ))}
        </select>
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
        label={isLoading ? 'Authenticating...' : `Sign in as ${currentRoleInfo.label}`}
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
