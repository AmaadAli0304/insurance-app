
import { NextResponse } from 'next/server';
import pool, { sql, poolConnect } from '@/lib/db';
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];

    // Verify token to get expiration time
    const { payload } = await jose.jwtVerify(token, secret);
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Fallback expiry

    await poolConnect;
    await pool.request()
      .input('token', sql.NVarChar, token)
      .input('expires_at', sql.DateTime, expiresAt)
      .query('INSERT INTO token_blacklist (token, expires_at) VALUES (@token, @expires_at)');

    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    // Instruct the client to clear the cookie, though middleware and client-side code also do this.
    response.cookies.set('token', '', { expires: new Date(0), path: '/' });
    
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error (e.g., bad token), proceed with logout on the client
    return NextResponse.json({ message: 'Logout process initiated' }, { status: 200 });
  }
}
