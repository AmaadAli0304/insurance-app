
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
    // Use header: 1 to get an array of arrays
    const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (sheetData.length < 2) {
      return { message: "No data found in the Excel file.", type: "error" };
    }
    
    const headers = sheetData[0].map(h => h.toString().trim());
    const nameHeader = "All Insurers Name";
    const emailHeader = "Email ID";
    
    const nameHeaderIndex = headers.indexOf(nameHeader);
    const emailHeaderIndex = headers.indexOf(emailHeader);

    if (nameHeaderIndex === -1 || emailHeaderIndex === -1) {
      return { message: "Could not find 'All Insurers Name' and 'Email ID' columns in the file. Please check the column headers.", type: "error" };
    }

    const data = sheetData.slice(1);
    
    poolConnection = await pool.connect();
    
    let companiesProcessed = 0;
    for (const row of data) {
      // Ensure row is an array and has data at the expected indices
      if (!Array.isArray(row) || row.length <= Math.max(nameHeaderIndex, emailHeaderIndex)) continue;

      const companyName = row[nameHeaderIndex];
      const companyEmail = row[emailHeaderIndex];

      if (companyName && companyEmail) {
        const request = poolConnection.request();
        await request
          .input('name', sql.NVarChar, companyName.toString())
          .input('email', sql.NVarChar, companyEmail.toString())
          .query(`
              INSERT INTO companies (name, email) 
              VALUES (@name, @email)
          `);
        companiesProcessed++;
      }
    }
    
    if (companiesProcessed > 0) {
        revalidatePath('/dashboard/companies');
        return { message: `${companiesProcessed} companies were imported successfully.`, type: "success" };
    } else {
        return { message: "No new companies were imported. The file may be empty or companies lacked required name/email.", type: "error" };
    }

  } catch (error) {
    console.error('Error importing companies:', error);
    const dbError = error as { message?: string };
    return { message: `Error importing companies: ${dbError.message || 'Unknown error'}`, type: "error" };
  } finally {
    await poolConnection?.close();
  }
}
