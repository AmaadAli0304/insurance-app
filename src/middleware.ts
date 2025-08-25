
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is simplified for a mock authentication setup.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // If there's no token and the user is trying to access a protected page,
  // redirect them to the login page.
  if (!token && !isAuthPage && pathname !== '/') {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If there is a token and the user is on an auth page,
  // let the client-side AuthProvider handle the redirect to the dashboard.
  if (token && isAuthPage) {
    return NextResponse.next();
  }

  // Allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, for now we allow them)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
