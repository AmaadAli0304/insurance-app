
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

// Check for missing environment variables
if (!config.user || !config.password || !config.server || !config.port || !config.database) {
    console.error("FATAL ERROR: Database environment variables are not set. Please check your .env file or deployment environment variables.");
    // Exit gracefully if essential variables are missing.
    // This prevents the app from crashing with a less clear error later on.
    if (typeof process.exit !== 'undefined') {
        // process.exit() is not available in all environments (like Vercel edge functions), but we call it if it exists.
        // process.exit(1);
    } else {
        throw new Error("Database environment variables are not set.");
    }
}


const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect().catch(err => {
    console.error('Initial Database Connection Error:', err);
    console.error('This might be due to incorrect credentials, firewall issues, or missing environment variables on your deployment platform (e.g., Vercel).');
});

pool.on('error', err => {
    console.error('SQL Pool Error', err);
});


export async function getDbConnection() {
  await poolConnect;
  return pool;
}

export { sql };
