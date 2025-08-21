
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
    const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (sheetData.length < 2) {
      return { message: "The uploaded file is empty or contains no data.", type: "error" };
    }

    const headers = sheetData[0].map(h => h.toString().trim().toLowerCase());
    const dataRows = sheetData.slice(1);

    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');

    if (nameIndex === -1 || emailIndex === -1) {
       const detectedHeaders = sheetData[0].map(h => h.toString().trim());
       return { 
         message: `Could not find 'Name' or 'Email' columns. Detected headers are: [${detectedHeaders.join(', ')}]. Please check the column headers.`,
         type: "error" 
       };
    }

    const companiesToInsert = dataRows
      .map(row => ({
        name: row[nameIndex]?.toString().trim(),
        email: row[emailIndex]?.toString().trim()
      }))
      .filter(company => company.name && company.email);

    if (companiesToInsert.length === 0) {
      return { message: "No companies with both name and email were found in the file.", type: "error" };
    }

    poolConnection = await pool.connect();
    let companiesProcessed = 0;

    for (const company of companiesToInsert) {
        try {
            await poolConnection.request()
              .input('name', sql.NVarChar, company.name)
              .input('email', sql.NVarChar, company.email)
              .query(`
                INSERT INTO companies (name, email) 
                VALUES (@name, @email)
              `);
            companiesProcessed++;
        } catch (insertError) {
            console.error(`Failed to insert company ${company.name} (${company.email}):`, insertError);
        }
    }
    
    if (companiesProcessed > 0) {
      revalidatePath('/dashboard/companies');
      return { message: `${companiesProcessed} new companies were successfully imported.`, type: "success" };
    } else {
      return { message: `No new companies were imported. This may be due to processing errors.`, type: "error" };
    }

  } catch (error) {
    console.error('Error during company import:', error);
    const dbError = error as { message?: string };
    return { message: `An unexpected error occurred: ${dbError.message || 'Unknown error'}`, type: "error" };
  } finally {
    poolConnection?.close();
  }
}
