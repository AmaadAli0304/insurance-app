'use server';

import { getDbPool } from '@/lib/db';

export async function checkDbConnection() {
  try {
    const pool = await getDbPool();
    // getDbPool throws if it cannot connect. If we get here, it's a success.
    // We can also check the connected status for an extra layer of validation.
    if (pool.connected) {
      return { success: true, message: 'Database connected successfully!' };
    }
    // This part of the code is unlikely to be reached due to the logic in getDbPool,
    // but it is included for completeness.
    return { success: false, message: 'Database connection failed. The pool was created but is not connected.' };
  } catch (error) {
    console.error('Database connection check failed:', error);
    const err = error as Error;
    // Return a more user-friendly message
    return { success: false, message: `Database connection failed: ${err.message}` };
  }
}
