import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicPaths = ['/login', '/signup', '/forgot-password', '/about', '/contact', '/register'];
  const isExactRoot = pathname === '/';
  const isSitemapOrRobots = pathname === '/sitemap.xml' || pathname === '/robots.txt';
  const isGoogleVerification = pathname.startsWith('/google') && pathname.endsWith('.html');
  const isPublicPath =
    isExactRoot ||
    isSitemapOrRobots ||
    isGoogleVerification ||
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // API routes for hardware (ESP32) stay open
  const isHardwareApi = pathname.startsWith('/api/hardware');

  // IoT LED controller API stays open (ESP32 polls this)
  const isIotApi = pathname.startsWith('/api/iot-led');

  // Auth API routes must stay open
  const isAuthApi = pathname.startsWith('/api/auth');

  if (isPublicPath || isHardwareApi || isIotApi || isAuthApi) {
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
