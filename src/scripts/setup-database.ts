
import pool, { poolConnect, sql } from '@/lib/db';
import { mockUsers } from '@/lib/mock-data';

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await poolConnect; // Wait for the initial connection to be established
    const request = pool.request();
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
    mockUsers[0].email = "admin@onestop.com"; // Ensure admin email is updated before seeding
    for (const user of mockUsers) {
      const password = user.password || 'password'; 

      const checkUserRequest = pool.request();
      const userExistsResult = await checkUserRequest
        .input('email_check', sql.NVarChar, user.email)
        .query('SELECT uid FROM users WHERE email = @email_check');

      if (userExistsResult.recordset.length === 0) {
        const insertRequest = pool.request();
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
      } else if (user.email === "admin@onestop.com") {
        // Special case to update the admin email if it was medichain before
         const updateAdminEmailRequest = pool.request();
         await updateAdminEmailRequest
          .input('new_email', sql.NVarChar, "admin@onestop.com")
          .input('old_email', sql.NVarChar, "admin@medichain.com")
          .query('UPDATE users SET email = @new_email WHERE email = @old_email');
        console.log('Updated admin user email to admin@onestop.com');
      }
      else {
        console.log(`User already exists: ${user.email}`);
      }
    }
    console.log('User seeding complete.');


    // Create Companies Table
    console.log('Checking for "companies" table...');
    const createCompaniesTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='companies' and xtype='U')
      BEGIN
        CREATE TABLE companies (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          contactPerson NVARCHAR(255),
          phone NVARCHAR(50),
          email NVARCHAR(255),
          address NVARCHAR(MAX),
          portalLink NVARCHAR(MAX)
        );
        PRINT '"companies" table created.';
      END
      ELSE
      BEGIN
          PRINT '"companies" table already exists.';
      END
    `;
    await request.query(createCompaniesTableQuery);
    console.log('Companies table check/create complete.');
    
    // Create TPAs Table
    console.log('Checking for "tpas" table...');
    const createTpasTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tpas' and xtype='U')
      BEGIN
        CREATE TABLE tpas (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          email NVARCHAR(255),
          phone NVARCHAR(50),
          portalLink NVARCHAR(MAX),
          address NVARCHAR(MAX)
        );
        PRINT '"tpas" table created.';
      END
      ELSE
      BEGIN
          PRINT '"tpas" table already exists.';
      END
    `;
    await request.query(createTpasTableQuery);
    console.log('TPAs table check/create complete.');

    console.log('Database setup complete!');

  } catch (err) {
    console.error('Error during database setup:', err);
    process.exit(1);
  } finally {
    await pool.close();
    console.log('Database connection closed.');
  }
}

setupDatabase();
