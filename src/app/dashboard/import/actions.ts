
"use server";

import * as XLSX from 'xlsx';
import pool from '@/lib/db';
import sql from 'mssql';
import { revalidatePath } from 'next/cache';

export async function handleImportCompanies(prevState: { message: string, type?: string }, formData: FormData) {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { message: "Please upload a valid XLSX file.", type: "error" };
  }

  let poolConnection;
  try {
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as { "All Insurers Name": string; "Email ID": string }[];

    if (!data || data.length === 0) {
      return { message: "No data found in the Excel file or file is not in the correct format.", type: "error" };
    }
    
    poolConnection = await pool.connect();
    
    let companiesProcessed = 0;
    for (const company of data) {
      const companyName = company["All Insurers Name"];
      const companyEmail = company["Email ID"];

      if (companyName && companyEmail) {
        const request = poolConnection.request();
        await request
          .input('name', sql.NVarChar, companyName)
          .input('email', sql.NVarChar, companyEmail)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM companies WHERE email = @email)
            BEGIN
              INSERT INTO companies (name, email) 
              VALUES (@name, @email)
            END
          `);
        companiesProcessed++;
      }
    }
    
    if (companiesProcessed > 0) {
        revalidatePath('/dashboard/companies');
        return { message: `${companiesProcessed} companies processed successfully.`, type: "success" };
    } else {
        return { message: "No new companies were imported.", type: "error" };
    }

  } catch (error) {
    console.error('Error importing companies:', error);
    const dbError = error as { message?: string };
    return { message: `Error importing companies: ${dbError.message || 'Unknown error'}`, type: "error" };
  } finally {
    await poolConnection?.close();
  }
}
