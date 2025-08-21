
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
    await pool.connect();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Get headers
    const headerRow: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    const headers = headerRow.map(header => typeof header === 'string' ? header.trim() : '');

    const nameHeader = headers.find(h => h.toLowerCase() === 'name');
    const emailHeader = headers.find(h => h.toLowerCase() === 'email');
    
    if (!nameHeader || !emailHeader) {
        return { message: `Could not find 'Name' and 'Email' columns. Detected headers: [${headers.join(', ')}]`, type: "error" };
    }

    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return { message: "The uploaded file is empty or has no data rows.", type: "error" };
    }

    let companiesProcessed = 0;
    const request = pool.request();
    
    for (const row of data) {
        const rowData = row as Record<string, any>;
        const name = rowData[nameHeader];
        const email = rowData[emailHeader];

        if (name && email) {
            try {
                await request.query`
                    INSERT INTO companies (name, email) 
                    VALUES (${name}, ${email})
                `;
                companiesProcessed++;
            } catch (err) {
                 console.error('Error inserting row:', err);
                 // We'll continue processing other rows even if one fails
            }
        }
    }

    if (companiesProcessed > 0) {
      revalidatePath('/dashboard/companies');
      return { message: `${companiesProcessed} new companies imported successfully.`, type: "success" };
    } else {
      return { message: "No new companies were imported. This may be due to processing errors or empty rows.", type: "error" };
    }

  } catch (error) {
    const dbError = error as { message?: string, code?: string };
    console.error('Error importing companies:', dbError);
    return { message: `Error importing companies: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
}
