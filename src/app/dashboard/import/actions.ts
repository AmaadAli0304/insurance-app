
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

  try {
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Read the header row to get column names
    const headers: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    const columnNames = headers.join(', ');

    return { message: `Detected columns: [${columnNames}]. Please ensure 'Name' and 'Email' columns exist.`, type: "error" };

  } catch (error) {
    const generalError = error as { message?: string };
    console.error('An error occurred during file processing:', generalError);
    return { message: `An unexpected error occurred while reading the file: ${generalError.message || 'Unknown error'}`, type: "error" };
  }
}

    