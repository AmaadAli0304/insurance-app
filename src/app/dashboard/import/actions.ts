
"use server";

import * as XLSX from 'xlsx';
import pool, { sql } from '@/lib/db';
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
      revalidatePath('/dashboard/companies');
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
