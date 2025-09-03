
import sql from 'mssql';

const config = {
  user: 'INSCSOFT',
  password: 'kveYm96Ngj3h',
  server: '139.5.237.238',
  port: 4554,
  database: 'Insurancesoft',
  options: {
    encrypt: true, 
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool;

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    // Ensure the pool is closed on a failed connection attempt to avoid leaving open connections.
    if (pool) {
      await pool.close();
    }
    const dbError = err as Error;
    throw new Error(`Failed to connect to the database: ${dbError.message}`);
  }
}

export const poolConnect = getDbPool();

export { sql };
export default {
  query: (text: string) => getDbPool().then(pool => pool.request().query(text)),
  request: () => getDbPool().then(pool => pool.request())
};
