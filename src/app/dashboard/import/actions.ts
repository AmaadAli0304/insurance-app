
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
    const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (sheetData.length === 0) {
        return { message: "The uploaded file is empty.", type: "error" };
    }

    const headers = sheetData[0].map(h => h.toString().trim());

    // For debugging, we will just return the headers found.
    return { message: `Detected headers: [${headers.join(', ')}]. Please ensure 'name' and 'email' are present.`, type: "error" };

  } catch (error) {
    console.error('Error reading file headers:', error);
    const dbError = error as { message?: string };
    return { message: `Error reading file: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
}
