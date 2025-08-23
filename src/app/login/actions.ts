
'use server';

import { redirect } from 'next/navigation';
import pool, { sql, poolConnect } from '@/lib/db';
import { z } from 'zod';
import type { User } from '@/lib/types';
import * as jose from 'jose';

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
    remember: z.string().optional(),
});

type LoginState = {
    error?: string;
    token?: string;
    rememberMe?: boolean;
};

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember'),
    });

    if (!parsed.success) {
        return { error: parsed.error.errors.map((e) => e.message).join(', ') };
    }

    const { email, password, remember } = parsed.data;
    const rememberMe = remember === 'on';

    try {
        await poolConnect;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        if (result.recordset.length === 0) {
            return { error: 'Invalid email or password.' };
        }

        const user: User = result.recordset[0];
        
        // In a real app, you MUST hash and compare passwords.
        // This is for demonstration purposes only.
        if (user.password !== password) {
            return { error: 'Invalid email or password.' };
        }

        const { password: _, ...userPayload } = user;

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables.');
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new jose.SignJWT(userPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(rememberMe ? '7d' : '1h')
            .sign(secret);

        return { token, rememberMe };

    } catch (error) {
        console.error("Login database error:", error);
        return { error: 'A server error occurred. Please try again later.' };
    }
}

export async function verifyToken(token: string): Promise<{ isValid: boolean; user: User | null }> {
    if (!token) return { isValid: false, user: null };

    try {
        await poolConnect;
        const blacklistCheck = await pool.request()
            .input('token', sql.NVarChar, token)
            .query('SELECT id FROM token_blacklist WHERE token = @token');
        
        if (blacklistCheck.recordset.length > 0) {
            return { isValid: false, user: null }; // Token is blacklisted
        }

        const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        return { isValid: true, user: payload as User };

    } catch (error) {
        console.error("Token verification failed", error);
        return { isValid: false, user: null };
    }
}
