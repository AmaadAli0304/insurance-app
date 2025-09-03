
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

// This is a simplified function to get a new connection every time.
// It helps to avoid pooling issues in serverless environments.
export async function getDbPool(): Promise<sql.ConnectionPool> {
    try {
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        const dbError = err as Error;
        throw new Error(`Failed to connect to the database: ${dbError.message}`);
    }
}

export { sql };
