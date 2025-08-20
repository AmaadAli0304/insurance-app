import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure SQL Database, or if you have an SSL certificate
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' // Change to true for local dev / self-signed certs
  }
};

const pool = new sql.ConnectionPool(config);
export default pool;
