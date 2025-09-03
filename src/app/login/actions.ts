
'use server';

import { getDbPool } from '@/lib/db';

export async function checkDbConnection() {
  try {
    const pool = await getDbPool();
    if (pool.connected) {
      // The pool will be closed automatically on process exit, but for a simple check, we can close it.
      // For a real app, you'd reuse the pool. We will close it here to be safe.
      // In a real scenario with concurrent users, you wouldn't close the pool after each check.
      return { success: true, message: 'Database connected successfully!' };
    }
    return { success: false, message: 'Database connection failed. The pool was created but is not connected.' };
  } catch (error) {
    console.error('Database connection check failed:', error);
    const err = error as Error;
    return { success: false, message: `Database connection failed: ${err.message}` };
  }
}
