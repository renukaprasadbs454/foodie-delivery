import { NextResponse } from 'next/server';
import {
  buildClearAuthSetCookieHeaders,
  readAccessTokenFromCookieHeader,
  readRefreshTokenFromCookieHeader,
} from 'foodie-shared-web/auth';
import { ENV } from '@/constants/env';

/**
 * BFF logout — UI-API Admin Settings logout via BFF (P2-AUTH-04 wiring).
 * Calls frozen `POST /api/v1/auth/logout` when refresh cookie present, then
 * always clears httpOnly auth cookies. Never returns token strings.
 */
export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const refreshToken = readRefreshTokenFromCookieHeader(cookieHeader);
  const accessToken = readAccessTokenFromCookieHeader(cookieHeader);

  if (refreshToken) {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      await fetch(
        `${ENV.apiBaseUrl.replace(/\/$/, '')}/api/v1/auth/logout`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ refreshToken }),
        },
      );
    } catch {
      // Still clear local cookies (UI-API: clear session always).
    }
  }

  const response = NextResponse.json(
    {
      success: true,
      data: null,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        pagination: null,
      },
    },
    { status: 200 },
  );
  for (const header of buildClearAuthSetCookieHeaders({
    secure: ENV.cookieSecure,
  })) {
    response.headers.append('Set-Cookie', header);
  }
  return response;
}
