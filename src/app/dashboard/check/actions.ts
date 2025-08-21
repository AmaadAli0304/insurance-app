
"use server";

import pool from '@/lib/db';
import sql from 'mssql';
import { mockUsers } from '@/lib/mock-data';


export async function handleCheckConnection(prevState: { message: string, variant: 'default' | 'destructive' | null }, formData: FormData) {
  let poolConnection;
  try {
    poolConnection = await pool.connect();
    const request = poolConnection.request();

    // Create Users Table
    const createUsersTableQuery = `
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
    await request.query(createUsersTableQuery);
    
    // Seed Users Table
    for (const user of mockUsers) {
      const password = user.password || 'password'; 

      const checkUserRequest = poolConnection.request();
      const userExistsResult = await checkUserRequest
        .input('email_check', sql.NVarChar, user.email)
        .query('SELECT uid FROM users WHERE email = @email_check');

      if (userExistsResult.recordset.length === 0) {
        const insertRequest = poolConnection.request();
        await insertRequest
          .input('uid', sql.NVarChar, user.uid)
          .input('name', sql.NVarChar, user.name)
          .input('email', sql.NVarChar, user.email)
          .input('role', sql.NVarChar, user.role)
          .input('hospitalId', sql.NVarChar, user.hospitalId)
          .input('companyId', sql.NVarChar, user.companyId)
          .input('password', sql.NVarChar, password)
          .query(`
              INSERT INTO users (uid, name, email, role, hospitalId, companyId, password) 
              VALUES (@uid, @name, @email, @role, @hospitalId, @companyId, @password)
          `);
      }
    }

    // Create Companies Table
    const createCompaniesTableQuery = `
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
    await request.query(createCompaniesTableQuery);

    return { message: 'Connection successful. Tables checked and seeded.', variant: 'default' };

  } catch (err: any) {
    console.error('Database connection/setup error:', err);
    return { message: `Connection failed: ${err.message}`, variant: 'destructive' };
  } finally {
    await poolConnection?.close();
  }
}
