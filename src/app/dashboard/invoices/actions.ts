
"use server";

import { revalidatePath } from "next/cache";
import { getDbPool, sql } from "@/lib/db";
import { z } from 'zod';
import { Invoice, InvoiceItem, Staff } from "@/lib/types";
import { redirect } from 'next/navigation';

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.coerce.number(),
  rate: z.coerce.number(),
  amount: z.coerce.number(),
});

// Fetch all invoices
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        i.*, 
        s.name as staffName
      FROM Invoices i
      LEFT JOIN users s ON i.staff_id = s.uid
      ORDER BY i.created_at DESC
    `);
    return result.recordset as Invoice[];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const dbError = error as Error;
    throw new Error(`Error fetching invoices: ${dbError.message}`);
  }
}

// Fetch a single invoice by ID
export async function getInvoiceById(id: number): Promise<(Invoice & { items: InvoiceItem[] }) | null> {
    try {
        const pool = await getDbPool();
        const [invoiceResult, itemsResult] = await Promise.all([
            pool.request()
                .input('id', sql.Int, id)
                .query(`
                  SELECT i.*, s.name as staffName 
                  FROM Invoices i
                  LEFT JOIN users s ON i.staff_id = s.uid
                  WHERE i.id = @id
                `),
            pool.request()
                .input('invoice_id', sql.Int, id)
                .query('SELECT * FROM invoice_staff WHERE invoice_id = @invoice_id')
        ]);

        if (invoiceResult.recordset.length === 0) {
            return null;
        }

        const invoice = invoiceResult.recordset[0] as Invoice;
        const items = itemsResult.recordset as InvoiceItem[];

        return { ...invoice, items };
    } catch (error) {
        console.error('Error fetching invoice by ID:', error);
        throw new Error('Failed to fetch invoice details from the database.');
    }
}

// Delete an invoice
export async function handleDeleteInvoice(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    let transaction;
    try {
        const pool = await getDbPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        await transaction.request()
            .input('invoice_id', sql.Int, Number(id))
            .query('DELETE FROM invoice_staff WHERE invoice_id = @invoice_id');
        
        const result = await transaction.request()
            .input('id', sql.Int, Number(id))
            .query('DELETE FROM Invoices WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return { message: "Invoice not found.", type: 'error' };
        }
        
        await transaction.commit();

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Database error during deletion:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/invoices');
    return { message: "Invoice deleted successfully.", type: 'success' };
}
