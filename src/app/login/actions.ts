
'use server';

import pool, { sql, poolConnect } from '@/lib/db';
import type { User } from '@/lib/types';
import * as jose from 'jose';

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
