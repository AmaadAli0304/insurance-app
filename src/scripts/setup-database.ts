

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
        companyId NVARCHAR(255),
        password NVARCHAR(255),
        designation NVARCHAR(255),
        department NVARCHAR(255),
        joiningDate DATE,
        endDate DATE,
        shiftTime NVARCHAR(100),
        status NVARCHAR(50),
        number NVARCHAR(50)
      );
    `;
    await request.query(createUsersTableQuery);
    console.log('"users" table created or already exists.');

    // Seed Users Table
    console.log('Seeding users table...');
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
          .input('companyId', sql.NVarChar, user.companyId)
          .input('password', sql.NVarChar, password)
          .input('designation', sql.NVarChar, user.designation)
          .input('department', sql.NVarChar, user.department)
          .input('joiningDate', user.joiningDate ? sql.Date : sql.Date, user.joiningDate ? new Date(user.joiningDate) : null)
          .input('endDate', user.endDate ? sql.Date : sql.Date, user.endDate ? new Date(user.endDate) : null)
          .input('shiftTime', sql.NVarChar, user.shiftTime)
          .input('status', sql.NVarChar, user.status)
          .input('number', sql.NVarChar, user.number)
          .query(`
              INSERT INTO users (uid, name, email, role, companyId, password, designation, department, joiningDate, endDate, shiftTime, status, number) 
              VALUES (@uid, @name, @email, @role, @companyId, @password, @designation, @department, @joiningDate, @endDate, @shiftTime, @status, @number)
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
    
    // Create Token Blacklist Table
    console.log('Checking for "token_blacklist" table...');
    const createTokenBlacklistTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='token_blacklist' and xtype='U')
      BEGIN
        CREATE TABLE token_blacklist (
          id INT IDENTITY(1,1) PRIMARY KEY,
          token NVARCHAR(MAX) NOT NULL,
          expires_at DATETIME NOT NULL
        );
        PRINT '"token_blacklist" table created.';
      END
      ELSE
      BEGIN
          PRINT '"token_blacklist" table already exists.';
      END
    `;
    await request.query(createTokenBlacklistTableQuery);
    console.log('Token blacklist table check/create complete.');

    // Create Patients Table
    console.log('Checking for "patients" table...');
    const createPatientsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='patients' and xtype='U')
      BEGIN
        CREATE TABLE patients (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          email_address NVARCHAR(255) NOT NULL,
          phone_number NVARCHAR(50) NOT NULL,
          alternative_number NVARCHAR(50),
          gender NVARCHAR(50) NOT NULL,
          age INT,
          birth_date DATE,
          address NVARCHAR(MAX) NOT NULL,
          occupation NVARCHAR(255),
          adhaar_path NVARCHAR(MAX),
          pan_path NVARCHAR(MAX),
          passport_path NVARCHAR(MAX),
          voter_id_path NVARCHAR(MAX),
          driving_licence_path NVARCHAR(MAX),
          other_path NVARCHAR(MAX),
          employee_id NVARCHAR(255),
          abha_id NVARCHAR(255),
          health_id NVARCHAR(255),
          hospital_id NVARCHAR(255),
          photo NVARCHAR(MAX),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
        PRINT '"patients" table created.';
      END
      ELSE
      BEGIN
        PRINT '"patients" table already exists.';
        -- Add photo column if it doesn't exist
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'photo' AND Object_ID = Object_ID(N'patients'))
        BEGIN
            ALTER TABLE patients ADD photo NVARCHAR(MAX);
            PRINT 'Added "photo" column to "patients" table.';
        END
      END
    `;
    await request.query(createPatientsTableQuery);
    console.log('Patients table check/create complete.');


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
