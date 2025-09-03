
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
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

const pool = new sql.ConnectionPool(config);

pool.on('error', err => {
    console.error('SQL Pool Error', err);
});

// We export the pool itself, and connection management will be handled by each function.
// This is more robust for serverless environments.
export const poolConnect = pool.connect();


export { sql };
export default pool;
