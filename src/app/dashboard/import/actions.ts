
"use server";

import * as XLSX from 'xlsx';
import pool, { sql, poolConnect } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function handleImportCompanies(prevState: { message: string, type?: string }, formData: FormData) {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { message: "Please upload a valid XLSX file.", type: "error" };
  }

  let transaction;
  try {
    await poolConnect;
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return { message: "The uploaded file is empty or has no data rows.", type: "error" };
    }

    const headerRow: any[] = data[0];
    const headers = headerRow.map(header => (typeof header === 'string' ? String(header).toLowerCase().trim() : ''));
    
    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');

    if (nameIndex === -1) {
      return { message: `Detected columns: [${headerRow.join(', ')}]. Please ensure 'Name' column exists.`, type: "error" };
    }

    const rowsToInsert = data.slice(1).map((row, index) => ({
      id: `comp-${Date.now()}-${index}`, // Generate a unique ID
      name: row[nameIndex],
      email: row[emailIndex] || null // Use null if email is missing
    })).filter(row => row.name); // Only filter if name is missing

    if (rowsToInsert.length === 0) {
      return { message: "No new companies were imported. This may be due to processing errors or empty rows.", type: "error" };
    }
    
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    const request = new sql.Request(transaction);
    const table = new sql.Table('companies');
    table.create = false; 
    table.columns.add('id', sql.NVarChar(255), { nullable: false });
    table.columns.add('name', sql.NVarChar(255), { nullable: false });
    table.columns.add('email', sql.NVarChar(255), { nullable: true });

    for (const row of rowsToInsert) {
      table.rows.add(row.id, row.name, row.email);
    }
    
    const result = await request.bulk(table);

    await transaction.commit();

    const companiesProcessed = result.rowsAffected;

    if (companiesProcessed > 0) {
      return { message: `${companiesProcessed} new companies imported successfully.`, type: "success" };
    } else {
      return { message: "No new companies were imported. This may be due to processing errors or empty rows.", type: "error" };
    }

  } catch (error) {
    if (transaction && transaction.rolledBack === false) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    const dbError = error as { message?: string, code?: string };
    console.error('Error importing companies:', dbError);
    return { message: `Error importing companies: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    await poolConnect;
    const request = pool.request();
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
      END
    `;
    await request.query(createTpasTableQuery);
    return { message: "TPA table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating TPA table:', dbError);
    return { message: `Error creating TPA table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateRelationshipTables(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    await poolConnect;
    const request = pool.request();
    
    const createHospitalCompaniesQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospital_companies' and xtype='U')
      BEGIN
        CREATE TABLE hospital_companies (
          id INT IDENTITY(1,1) PRIMARY KEY,
          company_id NVARCHAR(255),
          hospital_id NVARCHAR(255)
        );
      END
    `;
    await request.query(createHospitalCompaniesQuery);

    const createHospitalTpasQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospital_tpas' and xtype='U')
      BEGIN
        CREATE TABLE hospital_tpas (
          id INT IDENTITY(1,1) PRIMARY KEY,
          tpa_id INT,
          hospital_id NVARCHAR(255)
        );
      END
    `;
    await request.query(createHospitalTpasQuery);

    const createHospitalStaffQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospital_staff' and xtype='U')
      BEGIN
        CREATE TABLE hospital_staff (
          id INT IDENTITY(1,1) PRIMARY KEY,
          staff_id NVARCHAR(255),
          hospital_id NVARCHAR(255)
        );
      END
    `;
    await request.query(createHospitalStaffQuery);

    return { message: "Relationship tables created successfully or already exist.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating relationship tables:', dbError);
    return { message: `Error creating relationship tables: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateHospitalTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    await poolConnect;
    const request = pool.request();
    const createHospitalTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospitals' and xtype='U')
      BEGIN
        CREATE TABLE hospitals (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255),
          location NVARCHAR(255),
          address NVARCHAR(MAX),
          contact_person NVARCHAR(255),
          email NVARCHAR(255),
          phone NVARCHAR(50)
        );
      END
    `;
    await request.query(createHospitalTableQuery);
    return { message: "Hospital table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Hospital table:', dbError);
    return { message: `Error creating Hospital table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreatePatientsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    await poolConnect;
    const request = pool.request();
    const createPatientsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='patients' and xtype='U')
      BEGIN
        CREATE TABLE patients (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255),
          birth_date DATE,
          gender NVARCHAR(50),
          email NVARCHAR(255),
          phone NVARCHAR(50),
          address NVARCHAR(MAX),
          company_id NVARCHAR(255),
          policy_number NVARCHAR(255),
          member_id NVARCHAR(255),
          policy_start_date DATE,
          policy_end_date DATE,
          report_path NVARCHAR(MAX),
          id_path NVARCHAR(MAX),
          card_path NVARCHAR(MAX),
          package_path NVARCHAR(MAX)
        );
      END
    `;
    await request.query(createPatientsTableQuery);
    return { message: "Patients table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Patients table:', dbError);
    return { message: `Error creating Patients table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateFieldsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    await poolConnect;
    const request = pool.request();
    const createFieldsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fields' and xtype='U')
      BEGIN
        CREATE TABLE fields (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          required BIT NOT NULL,
          type NVARCHAR(50) NOT NULL,
          company_id NVARCHAR(255) NOT NULL,
          CONSTRAINT UQ_field_name_company_id UNIQUE (name, company_id)
        );
      END
    `;
    await request.query(createFieldsTableQuery);
    return { message: "Fields table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Fields table:', dbError);
    return { message: `Error creating Fields table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}
