
'use server';

import { getDbPool } from '@/lib/db';

export async function checkDbConnection() {
  let pool;
  try {
    pool = await getDbPool();
    if (pool.connected) {
      return { success: true, message: 'Database connected successfully!' };
    }
    return { success: false, message: 'Database connection failed. The pool was created but is not connected.' };
  } catch (error) {
    console.error('Database connection check failed:', error);
    const err = error as Error;
    return { success: false, message: `Database connection failed: ${err.message}` };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
