
import pool from '@/lib/db';
import sql from 'mssql';

async function createUsersTable() {
  try {
    const poolConnection = await pool.connect();
    const request = poolConnection.request();
    
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
      CREATE TABLE users (
        uid NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        role NVARCHAR(50) NOT NULL,
        hospitalId NVARCHAR(255),
        companyId NVARCHAR(255),
        password NVARCHAR(255)
      );
    `;

    await request.query(query);
    console.log('"users" table created or already exists.');

    poolConnection.close();
  } catch (err) {
    console.error('Error creating "users" table:', err);
  }
}

createUsersTable();
