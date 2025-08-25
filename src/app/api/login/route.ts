
import { NextResponse } from 'next/server';
import pool, { sql, poolConnect } from '@/lib/db';
import type { User } from '@/lib/types';
import * as jose from 'jose';

export async function POST(request: Request) {
    try {
        await poolConnect;
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: 'No user found with this email.' }, { status: 404 });
        }
        
        const user: User = result.recordset[0];

        // In a real app, you'd use a hashing library like bcrypt to compare passwords.
        // For this project, we are comparing plain text.
        if (user.password !== password) {
            return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
        }

        const { password: _, ...userPayload } = user;

        // In a real scenario, the secret would be in env variables.
        const secret = new TextEncoder().encode('your-super-secret-jwt-key-that-is-at-least-32-bytes-long');
        
        const token = await new jose.SignJWT(userPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h') // Token expires in 1 hour
            .sign(secret);

        return NextResponse.json({ token, user: userPayload });

    } catch (error) {
        console.error("Login API error:", error);
        return NextResponse.json({ error: 'A server error occurred.' }, { status: 500 });
    }
}
