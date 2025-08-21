
import pool from '@/lib/db';
import sql from 'mssql';
import { mockUsers } from '@/lib/mock-data';

async function setupDatabase() {
  let poolConnection;
  try {
    console.log('Connecting to database...');
    poolConnection = await pool.connect();
    const request = poolConnection.request();
    console.log('Connection successful.');

    // Create Users Table
    console.log('Checking for "users" table...');
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
    console.log('"users" table created or already exists.');

    // Seed Users Table
    console.log('Seeding users table...');
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
        console.log(`Inserted user: ${user.email}`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    }
    console.log('User seeding complete.');


    // Create Companies Table
    console.log('Checking for "companies" table...');
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
    console.log('"companies" table created or already exists.');
    
    console.log('Database setup complete!');

  } catch (err) {
    console.error('Error during database setup:', err);
    process.exit(1);
  } finally {
    await poolConnection?.close();
    console.log('Database connection closed.');
  }
}

setupDatabase();
