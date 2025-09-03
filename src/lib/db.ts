
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: '139.5.237.238',
  port: 4554,
  database: process.env.DB_DATABASE,
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

if (!config.user || !config.password || !config.database) {
    console.error("FATAL ERROR: DB_USER, DB_PASSWORD, or DB_DATABASE environment variables are not set.");
    throw new Error("Database environment variables are not configured. The application cannot start.");
}

let pool: sql.ConnectionPool | null = null;

export async function getDbPool(): Promise<sql.ConnectionPool> {
    if (pool && pool.connected) {
        return pool;
    }
    try {
        pool = new sql.ConnectionPool(config);
        pool.on('error', err => {
            console.error('SQL Pool Error', err);
            pool = null; // Reset pool on error
        });
        await pool.connect();
        return pool;
    } catch (err) {
        // If connection fails, reset the pool to null to allow for retries
        pool = null;
        console.error('Database connection failed:', err);
        throw new Error('Failed to connect to the database.');
    }
}

export { sql };
