
import { NextResponse } from 'next/server';

// This is a mock logout. For client-side auth, clearing the cookie is enough.
export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    // Instruct the client to clear the cookie
    response.cookies.set('token', '', { expires: new Date(0), path: '/' });
    
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ message: 'Logout process initiated' }, { status: 200 });
    response.cookies.set('token', '', { expires: new Date(0), path: '/' });
    return response;
  }
}
