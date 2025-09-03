
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Directly setting to true as per "Mandatory"
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Check for missing environment variables on app startup
if (!config.user || !config.password || !config.server || !config.port || !config.database) {
    console.error("FATAL ERROR: Database environment variables are not set. Please check your .env file or deployment environment variables.");
    // In a serverless environment, throwing an error is better than trying to exit.
    throw new Error("Database environment variables are not configured. The application cannot start.");
}

let pool: sql.ConnectionPool | null = null;

export async function getDbPool() {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    pool.on('error', err => {
      console.error('SQL Pool Error', err);
      // Reset pool on error
      pool = null;
    });
  }
  if (!pool.connected) {
    try {
      await pool.connect();
    } catch (err) {
      console.error('Database connection failed:', err);
      // In case of connection error, reset the pool to allow for retries.
      pool = null; 
      throw err; // re-throw the error to be caught by the calling function
    }
  }
  return pool;
}

export const poolConnect = getDbPool();


export { sql };
export default pool;



