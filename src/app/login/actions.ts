
'use server';

import type { User } from '@/lib/types';
import * as jose from 'jose';

// This is a mock verification
export async function verifyToken(token: string): Promise<{ isValid: boolean; user: User | null }> {
    if (!token) return { isValid: false, user: null };

    try {
        // In a real scenario, the secret would be in env variables.
        const secret = new TextEncoder().encode('your-super-secret-jwt-key-that-is-at-least-32-bytes-long');
        const { payload } = await jose.jwtVerify(token, secret);
        
        // This is a mock implementation, so we assume the payload is a valid user
        return { isValid: true, user: payload as User };

    } catch (error) {
        // This will catch expired tokens or invalid signatures
        console.error("Token verification failed", error);
        return { isValid: false, user: null };
    }
}
