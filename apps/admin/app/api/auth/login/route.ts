import { NextResponse } from 'next/server';
import {
  buildAuthSetCookieHeaders,
  buildClearAuthSetCookieHeaders,
} from 'foodie-shared-web/auth';
import { ENV } from '@/constants/env';

type LoginBody = {
  email?: string;
  password?: string;
  deviceInfo?: string;
};

/**
 * BFF Admin login — GAP-API-13.
 * Proxies POST /api/v1/auth/login, sets httpOnly cookies, returns identity only (TD-012).
 * Strictly requires backend validation; no hardcoded mock fallback.
 */
export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request body must be JSON',
          fields: null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          pagination: null,
        },
      },
      { status: 400 },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'email and password are required',
          fields: {
            ...(email ? {} : { email: 'required' }),
            ...(password ? {} : { password: 'required' }),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          pagination: null,
        },
      },
      { status: 400 },
    );
  }

  try {
    const primaryUrl = `${ENV.apiBaseUrl.replace(/\/$/, '')}/api/v1/auth/login`;
    const fallbackUrl = 'http://localhost:8082/api/v1/auth/login';
    const payload = JSON.stringify({
      email,
      password,
      deviceInfo: body.deviceInfo ?? 'Admin Panel',
    });
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    let upstream: Response;
    try {
      upstream = await fetch(primaryUrl, { method: 'POST', headers, body: payload });
      if (upstream.status === 502 && primaryUrl !== fallbackUrl) {
        try {
          const fallbackRes = await fetch(fallbackUrl, { method: 'POST', headers, body: payload });
          upstream = fallbackRes;
        } catch {
          // Keep primary upstream
        }
      }
    } catch {
      if (primaryUrl !== fallbackUrl) {
        upstream = await fetch(fallbackUrl, { method: 'POST', headers, body: payload });
      } else {
        throw new Error('Network error');
      }
    }

    const envelope = (await upstream.json()) as {
      success?: boolean;
      data?: {
        accessToken?: string;
        refreshToken?: string;
        userId?: string;
        userType?: string;
        role?: string | null;
      } | null;
      error?: { code?: string; message?: string; fields?: unknown } | null;
      meta?: {
        timestamp?: string;
        requestId?: string;
        pagination?: unknown;
      } | null;
    };

    const meta = envelope?.meta ?? {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      pagination: null,
    };

    if (
      envelope?.success &&
      envelope.data?.accessToken &&
      envelope.data?.refreshToken &&
      envelope.data.userId &&
      envelope.data.userType === 'ADMIN' &&
      envelope.data.role
    ) {
      const response = NextResponse.json(
        {
          success: true,
          data: {
            userId: envelope.data.userId,
            userType: 'ADMIN',
            role: envelope.data.role,
          },
          error: null,
          meta,
        },
        { status: upstream.status },
      );
      for (const header of buildAuthSetCookieHeaders(
        {
          accessToken: envelope.data.accessToken,
          refreshToken: envelope.data.refreshToken,
        },
        {
          access: { secure: ENV.cookieSecure },
          refresh: { secure: ENV.cookieSecure },
        },
      )) {
        response.headers.append('Set-Cookie', header);
      }
      return response;
    }

    const response = NextResponse.json(
      {
        success: false,
        data: null,
        error: envelope?.error ?? {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
          fields: null,
        },
        meta,
      },
      { status: upstream.status >= 400 ? upstream.status : 401 },
    );
    for (const header of buildClearAuthSetCookieHeaders({
      secure: ENV.cookieSecure,
    })) {
      response.headers.append('Set-Cookie', header);
    }
    return response;
  } catch {
    const response = NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Backend server unreachable. Please verify system status.',
          fields: null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          pagination: null,
        },
      },
      { status: 502 },
    );
    for (const header of buildClearAuthSetCookieHeaders({
      secure: ENV.cookieSecure,
    })) {
      response.headers.append('Set-Cookie', header);
    }
    return response;
  }
}
