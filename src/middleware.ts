
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@/lib/types';

const getRoleFromPath = (path: string): UserRole | null => {
    if (path.startsWith('/dashboard/companies') || path.startsWith('/dashboard/company-hospitals')) return 'Company Admin';
    if (path.startsWith('/dashboard/patients') || path.startsWith('/dashboard/pre-auths') || path.startsWith('/dashboard/claims')) return 'Hospital Staff';
    // Add more specific admin routes if necessary
    return null;
}

// This middleware is simplified to allow all requests to pass through.
// Client-side authentication logic in AuthProvider handles all redirection.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token'); // This is a placeholder, as we're using localStorage client-side

  const isAuthPage = pathname.startsWith('/login');

  if (isAuthPage) {
    return NextResponse.next();
  }

  if (!pathname.startsWith('/dashboard')) {
      return NextResponse.next();
  }
  
  // The logic below is mostly handled client-side now,
  // but this serves as a basic server-side safeguard.
  // A robust solution would involve decoding the role-specific token.
  
  const role = getRoleFromPath(pathname);
  
  if (!token) { // Simplified check
    let url = req.nextUrl.clone();
    if(role === 'Company Admin') url.pathname = '/login/company-admin';
    else if (role === 'Hospital Staff') url.pathname = '/login/hospital-staff';
    else if (role === 'Admin') url.pathname = '/login/admin';
    else url.pathname = '/login/company-admin'; // Default fallback
    
    //return NextResponse.redirect(url);
  }

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
