
import pool from '@/lib/db';
import sql from 'mssql';
import { mockUsers } from '@/lib/mock-data';

async function setupUsersTable() {
  let poolConnection;
  try {
    poolConnection = await pool.connect();
    const request = poolConnection.request();
    
    const createTableQuery = `
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

    await request.query(createTableQuery);
    console.log('"users" table created or already exists.');

    // Seed the table with mock users
    console.log('Seeding users table...');
    for (const user of mockUsers) {
        // Use a temporary password for all mock users
        const password = 'password';

        const checkUser = await request.input('email_check', sql.NVarChar, user.email).query('SELECT uid FROM users WHERE email = @email_check');

        if (checkUser.recordset.length === 0) {
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

  } catch (err) {
    console.error('Error during users table setup:', err);
  } finally {
      poolConnection?.close();
  }
}

setupUsersTable();
