
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: "139.5.237.238",
  port: 4554,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  connectionTimeout: 15000,
  requestTimeout: 15000,
};

// Check for missing environment variables on app startup
if (!config.user || !config.password || !config.database) {
    console.error("FATAL ERROR: Database user, password, or database name are not set. Please check your .env file or deployment environment variables.");
    // In a serverless environment, throwing an error is better than trying to exit.
    throw new Error("Database environment variables are not configured. The application cannot start.");
}

let pool: sql.ConnectionPool | null = null;

export async function getDbPool() {
  if (!pool || !pool.connected) {
    try {
      if (pool) {
        await pool.close();
      }
      pool = new sql.ConnectionPool(config);
      pool.on('error', err => {
        console.error('SQL Pool Error', err);
        pool = null; // Reset pool on error
      });
      await pool.connect();
    } catch (err) {
      console.error('Database connection failed:', err);
      pool = null; 
      throw err;
    }
  }
  return pool;
}

export const poolConnect = getDbPool();


export { sql };
export default pool;
