
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import pool, { sql, poolConnect } from '@/lib/db';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isApiAuthRoute = pathname.startsWith('/api/login') || pathname.startsWith('/api/signup') || pathname.startsWith('/api/logout');
  
  if (!token) {
    if (isAuthPage || isApiAuthRoute || pathname === '/') {
        return NextResponse.next();
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If there's a token, verify it
  try {
    await jose.jwtVerify(token, secret);
    
    // Check if token is blacklisted
    await poolConnect;
    const result = await pool.request()
        .input('token', sql.NVarChar, token)
        .query('SELECT id FROM token_blacklist WHERE token = @token');
        
    if (result.recordset.length > 0) {
        // Token is blacklisted, treat as logged out
        const loginUrl = new URL('/login', req.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('token'); // Clear the invalid cookie
        return response;
    }

    // If token is valid and not blacklisted, and user is on an auth page, redirect to dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

  } catch (error) {
    // Token is invalid (expired or bad signature)
    if (isAuthPage || isApiAuthRoute || pathname === '/') {
        return NextResponse.next();
    }
    const loginUrl = new URL('/login', req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token'); // Clear the invalid cookie
    return response;
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
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
