import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from 'foodie-shared-web/auth';

/**
 * Middleware route protection — Blueprint §15.2 / System Design §5.3.
 * Cookie presence gate for (dashboard). Role claims are restored via login /
 * refresh identity (GAP-API-13).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccess = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const hasRefresh = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);
  const hasSession = hasAccess || hasRefresh;

  const isAuthRoute = pathname.startsWith('/login');
  const isDashboardRoute =
    pathname.startsWith('/restaurants') ||
    pathname.startsWith('/delivery-partners') ||
    pathname.startsWith('/coupons') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/reviews') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/audit-log') ||
    pathname === '/';

  if (isDashboardRoute && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/restaurants/:path*',
    '/delivery-partners/:path*',
    '/coupons/:path*',
    '/orders/:path*',
    '/payments/:path*',
    '/reviews/:path*',
    '/analytics/:path*',
    '/audit-log/:path*',
  ],
};
