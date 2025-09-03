
'use server';

import { getDbPool } from '@/lib/db';

export async function checkDbConnection() {
  let pool;
  try {
    pool = await getDbPool();
    // If getDbPool succeeds, the connection is established.
    return { success: true, message: 'Database connected successfully!' };
  } catch (error) {
    console.error('Database connection check failed:', error);
    const err = error as Error;
    // Return the specific error message from the exception.
    return { success: false, message: `Database connection failed: ${err.message}` };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
