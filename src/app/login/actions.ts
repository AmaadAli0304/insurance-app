
'use server';

import { redirect } from 'next/navigation';
import pool, { sql, poolConnect } from '@/lib/db';
import { z } from 'zod';
import type { User } from '@/lib/types';

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
    remember: z.string().optional(),
});

type LoginState = {
    error?: string;
    user?: User;
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
        // For this project, we are comparing plain text.
        if (user.password !== password) {
            return { error: 'Invalid email or password.' };
        }

        // Do not return the password hash to the client
        const { password: _, ...userSafeToReturn } = user;

        return { user: userSafeToReturn, rememberMe };

    } catch (error) {
        console.error("Login database error:", error);
        return { error: 'A server error occurred. Please try again later.' };
    }
}
