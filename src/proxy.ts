import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicPaths = ['/login', '/signup', '/forgot-password'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // API routes for hardware (ESP32) stay open
  const isHardwareApi = pathname.startsWith('/api/hardware');

  // Auth API routes must stay open
  const isAuthApi = pathname.startsWith('/api/auth');

  if (isPublicPath || isHardwareApi || isAuthApi) {
    return NextResponse.next();
  }

  // Check for session cookie (authjs.session-token or __Secure-authjs.session-token)
  const sessionToken =
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token');

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
