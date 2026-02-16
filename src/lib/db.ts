
import sql from 'mssql';

const config = {
  user: "admin",
  password: "qrPgK#SFwd",
  server: "insurancesoft.cf2i0ooyg93r.ap-south-1.rds.amazonaws.com",
  port: 1433,
  database: "Insurancesoftlive",
  connectionTimeout: 60000,  // 60s - RDS can be slow to respond
  requestTimeout: 60000,     // 60s - initial setup query may need more time
  options: {
    encrypt: true,
    trustServerCertificate: true,  // Required for AWS RDS
    enableArithAbort: true,        // Often required for RDS SQL Server
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | undefined;

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (pool?.connected) {
    return pool;
  }
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    // Setup company_settings table on initial connection if it doesn't exist
    const request = pool.request();
    const companySettingsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='company_settings' and xtype='U')
      BEGIN
        CREATE TABLE company_settings (
          id INT IDENTITY(1,1) PRIMARY KEY,
          company_id NVARCHAR(255) NOT NULL UNIQUE,
          name NVARCHAR(255),
          address NVARCHAR(MAX),
          gst_no NVARCHAR(100),
          pan_no NVARCHAR(100),
          contact_no NVARCHAR(50),
          banking_details NVARCHAR(MAX),
          account_name NVARCHAR(255),
          bank_name NVARCHAR(255),
          branch NVARCHAR(255),
          account_no NVARCHAR(50),
          ifsc_code NVARCHAR(50),
          header_img NVARCHAR(MAX),
          footer_img NVARCHAR(MAX),
          CONSTRAINT FK_company_settings_companies FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        );
      END
      ELSE
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'header_img' AND Object_ID = Object_ID(N'company_settings'))
          BEGIN
              ALTER TABLE company_settings ADD header_img NVARCHAR(MAX);
          END
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'footer_img' AND Object_ID = Object_ID(N'company_settings'))
          BEGIN
              ALTER TABLE company_settings ADD footer_img NVARCHAR(MAX);
          END
      END
    `;
    await request.query(companySettingsTableQuery);
    
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    const failedPool = pool;
    pool = undefined;
    if (failedPool) {
      try { await failedPool.close(); } catch { /* ignore */ }
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
