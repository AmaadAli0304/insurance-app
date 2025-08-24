
import { NextResponse } from 'next/server';
import pool, { sql, poolConnect } from '@/lib/db';
import { z } from 'zod';
import type { User } from '@/lib/types';
import * as jose from 'jose';

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors.map((e) => e.message).join(', ') }, { status: 400 });
        }

        const { email, password } = parsed.data;

        await poolConnect;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const user: User = result.recordset[0];
        
        // IMPORTANT: In a real app, you would compare a hashed password.
        // This is a simplified check for demonstration purposes.
        if (user.password !== password) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // Remove password from the object that will be encoded in the token
        const { password: _, ...userPayload } = user;

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables.');
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        
        const token = await new jose.SignJWT(userPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d') 
            .sign(secret);

        return NextResponse.json({ token });

    } catch (error) {
        console.error("Login API error:", error);
        return NextResponse.json({ error: 'A server error occurred. Please try again later.' }, { status: 500 });
    }
}
