
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
  let companiesProcessed = 0;

  try {
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return { message: "The uploaded file contains no data.", type: "error" };
    }

    poolConnection = await pool.connect();

    for (const row of data) {
      // Use case-insensitive matching for "Name" and "Email"
      const companyName = row['Name'] || row['name'];
      const companyEmail = row['Email'] || row['email'];

      if (companyName && companyEmail) {
        try {
          await poolConnection.request()
            .input('name', sql.NVarChar, companyName)
            .input('email', sql.NVarChar, companyEmail)
            .query(`
              INSERT INTO companies (name, email) 
              VALUES (@name, @email)
            `);
          companiesProcessed++;
        } catch (insertError) {
            const dbError = insertError as { message?: string };
            console.error(`Failed to insert company ${companyName}:`, dbError.message);
            // Optionally, we can return the specific error for one row
            // For now, we will continue and report a general error at the end.
        }
      }
    }

  } catch (error) {
    const generalError = error as { message?: string };
    console.error('An error occurred during the import process:', generalError);
    return { message: `An unexpected error occurred: ${generalError.message || 'Unknown error'}`, type: "error" };
  } finally {
    await poolConnection?.close();
  }

  if (companiesProcessed > 0) {
    revalidatePath('/dashboard/companies');
    return { message: `${companiesProcessed} new companies were successfully imported.`, type: "success" };
  } else {
    return { message: "No new companies were imported. Please check your file content and column headers (expected 'Name' and 'Email').", type: "error" };
  }
}

    