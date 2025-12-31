
"use server";

import { getDbPool, sql } from '@/lib/db';

export async function handleCreateCompanySettingsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createCompanySettingsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='company_settings' and xtype='U')
      BEGIN
        CREATE TABLE company_settings (
          id INT IDENTITY(1,1) PRIMARY KEY,
          company_id NVARCHAR(255) NOT NULL,
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
          ifsc_code NVARCHAR(50)
        );
      END
    `;
    await request.query(createCompanySettingsTableQuery);
    return { message: "Company settings table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating company_settings table:', dbError);
    return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}
