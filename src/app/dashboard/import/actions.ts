
"use server";

import * as XLSX from 'xlsx';
import { getDbConnection, sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function handleImportCompanies(prevState: { message: string, type?: string }, formData: FormData) {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { message: "Please upload a valid XLSX file.", type: "error" };
  }

  let transaction;
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return { message: "The uploaded file is empty or has no data rows.", type: "error" };
    }

    const headerRow: any[] = data[0];
    const headers = headerRow.map(header => (typeof header === 'string' ? header.toLowerCase().trim() : ''));
    
    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');

    if (nameIndex === -1 || emailIndex === -1) {
      return { message: `Detected columns: [${headerRow.join(', ')}]. Please ensure 'Name' and 'Email' columns exist.`, type: "error" };
    }

    const rowsToInsert = data.slice(1).map(row => ({
      name: row[nameIndex],
      email: row[emailIndex]
    })).filter(row => row.name && row.email);

    if (rowsToInsert.length === 0) {
      return { message: "No valid rows with both Name and Email were found in the file.", type: "error" };
    }
    
    const pool = await getDbConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    let companiesProcessed = 0;
    const request = new sql.Request(transaction);

    // Prepare the statement for insertion
    const preparedStatement = new sql.PreparedStatement(transaction);
    preparedStatement.input('name', sql.NVarChar);
    preparedStatement.input('email', sql.NVarChar);
    await preparedStatement.prepare('INSERT INTO companies (name, email) VALUES (@name, @email)');

    for (const row of rowsToInsert) {
      await preparedStatement.execute({ name: row.name, email: row.email });
      companiesProcessed++;
    }

    await preparedStatement.unprepare();
    await transaction.commit();

    if (companiesProcessed > 0) {
      revalidatePath('/dashboard/companies');
      return { message: `${companiesProcessed} new companies imported successfully.`, type: "success" };
    } else {
      return { message: "No new companies were imported. This may be due to processing errors or empty rows.", type: "error" };
    }

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    const dbError = error as { message?: string, code?: string };
    console.error('Error importing companies:', dbError);
    return { message: `Error importing companies: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}
