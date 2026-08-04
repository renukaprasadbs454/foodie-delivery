import { ENV } from '../../constants/env';

export type GoogleSignInResult =
  | { status: 'success'; idToken: string }
  | { status: 'cancelled' }
  | { status: 'unavailable'; message: string };

/**
 * Obtain a Google ID token for `POST /api/v1/auth/google`.
 * Native Google SDK wiring requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (+ platform config).
 * Until configured, fails closed with `unavailable` — never invents tokens.
 *
 * Optional local/dev override: EXPO_PUBLIC_GOOGLE_ID_TOKEN (tests / staged harness only).
 */
export async function obtainGoogleIdToken(): Promise<GoogleSignInResult> {
  const harnessToken = process.env.EXPO_PUBLIC_GOOGLE_ID_TOKEN;
  if (harnessToken && harnessToken.length > 0) {
    return { status: 'success', idToken: harnessToken };
  }

  if (!ENV.googleWebClientId) {
    return {
      status: 'unavailable',
      message:
        'Google Sign-In is not configured for this build. Use phone OTP, or set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.',
    };
  }

  // Client ID present but native Google provider not linked in this module wave.
  return {
    status: 'unavailable',
    message:
      'Google Sign-In native provider is not linked in this build. Use phone OTP.',
  };
}
