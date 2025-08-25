
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is simplified to allow all requests to pass through.
// Client-side authentication logic in AuthProvider handles all redirection.
export async function middleware(req: NextRequest) {
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
