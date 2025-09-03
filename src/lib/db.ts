
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

// Check for missing environment variables that are still needed
if (!config.user || !config.password || !config.database) {
    console.error("FATAL ERROR: DB_USER, DB_PASSWORD, or DB_DATABASE environment variables are not set.");
    throw new Error("Database environment variables are not configured. The application cannot start.");
}

const pool = new sql.ConnectionPool(config);

pool.on('error', err => {
    console.error('SQL Pool Error', err);
});

export const poolConnect = pool.connect();


export { sql };
export default pool;
