
import pool from '@/lib/db';
import sql from 'mssql';

async function setupCompaniesTable() {
  let poolConnection;
  try {
    poolConnection = await pool.connect();
    const request = poolConnection.request();
    
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='companies' and xtype='U')
      CREATE TABLE companies (
        id NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        contactPerson NVARCHAR(255),
        phone NVARCHAR(50),
        email NVARCHAR(255),
        address NVARCHAR(MAX),
        portalLink NVARCHAR(MAX)
      );
    `;

    await request.query(createTableQuery);
    console.log('"companies" table created or already exists.');

  } catch (err) {
    console.error('Error during companies table setup:', err);
  } finally {
      poolConnection?.close();
  }
}

setupCompaniesTable();
