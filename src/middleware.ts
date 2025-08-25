
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isApiAuthRoute = pathname.startsWith('/api/login') || pathname.startsWith('/api/signup');

  // If there's no token and the user is trying to access a protected page
  if (!token && !isAuthPage && !isApiAuthRoute && pathname !== '/') {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If there is a token and the user is on an auth page
  if (token && isAuthPage) {
    // Let the client-side AuthProvider handle the redirect to dashboard
    // This prevents middleware from redirecting before the client can validate the token
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
