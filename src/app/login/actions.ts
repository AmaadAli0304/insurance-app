
'use server';

import pool from '@/lib/db';
import sql from 'mssql';
import type { User } from '@/lib/types';

export async function authenticateUser(prevState: { message: string }, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Email and password are required.', user: null };
  }

  let poolConnection;
  try {
    poolConnection = await pool.connect();
    const result = await poolConnection
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email');

    if (result.recordset.length === 0) {
      return { message: 'Invalid email or password.', user: null };
    }

    const user: User = result.recordset[0];

    // NOTE: This is a plain text password comparison. 
    // In a production environment, you should use a secure hashing algorithm (e.g., bcrypt).
    if (user.password !== password) {
      return { message: 'Invalid email or password.', user: null };
    }
    
    // Do not send password to the client
    const { password: _, ...userClientData } = user;

    return { message: '', user: userClientData };
  } catch (error) {
    console.error('Authentication error:', error);
    const dbError = error as { code?: string };
    if (dbError.code === 'ELOGIN' || dbError.code === 'ETIMEOUT') {
        return { message: 'Failed to connect to the database. Please check your connection settings.', user: null };
    }
    return { message: 'An unexpected error occurred during authentication.', user: null };
  } finally {
      poolConnection?.close();
  }
}
