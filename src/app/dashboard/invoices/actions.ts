
"use server";

import { revalidatePath } from "next/cache";
import { getDbPool, sql } from "@/lib/db";
import { z } from 'zod';
import { Invoice, InvoiceItem, Staff } from "@/lib/types";
import { redirect } from 'next/navigation';

const invoiceItemSchema = z.object({
  description: z.string(),
  qty: z.coerce.number(),
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


export async function handleSaveInvoice(prevState: { message: string, type?: string }, formData: FormData) {
  const staffId = formData.get('staffId') as string;
  const hospitalId = formData.get('hospitalId') as string;
  const to = formData.get('to') as string;
  const address = formData.get('address') as string;
  const period = formData.get('period') as string;
  const contract_type = formData.get('contract_type') as string;
  const service_provided = formData.get('service_provided') as string;
  const bank_name = formData.get('bank_name') as string;
  const account_name = formData.get('account_name') as string;
  const account_number = formData.get('account_number') as string;
  const ifsc_code = formData.get('ifsc_code') as string;
  const branch = formData.get('branch') as string;
  const itemsJson = formData.get('items') as string;
  const status = formData.get('status') as string;

  if (!staffId || !itemsJson || !hospitalId) {
      return { message: 'Missing required invoice data.', type: 'error' };
  }

  let transaction;
  try {
      const items = JSON.parse(itemsJson);
      const parsedItems = z.array(invoiceItemSchema).safeParse(items);
      if (!parsedItems.success) {
          return { message: 'Invalid invoice items format.', type: 'error' };
      }

      const db = await getDbPool();
      transaction = new sql.Transaction(db);
      await transaction.begin();

      const invoiceRequest = new sql.Request(transaction);
      const invoiceResult = await invoiceRequest
          .input('to', sql.NVarChar, to)
          .input('hospital', sql.NVarChar, hospitalId) // Save hospital ID
          .input('address', sql.NVarChar, address)
          .input('period', sql.NVarChar, period)
          .input('contract_type', sql.NVarChar, contract_type)
          .input('service_provided', sql.NVarChar, service_provided)
          .input('bank_name', sql.NVarChar, bank_name)
          .input('account_name', sql.NVarChar, account_name)
          .input('account_number', sql.NVarChar, account_number)
          .input('ifsc_code', sql.NVarChar, ifsc_code)
          .input('branch', sql.NVarChar, branch)
          .input('staff_id', sql.NVarChar, staffId)
          .input('status', sql.NVarChar, status)
          .query(`
              INSERT INTO Invoices (
                  "to", hospital, address, period, contract_type, service_provided, 
                  bank_name, account_name, account_number, ifsc_code, branch, staff_id, created_at, status
              )
              OUTPUT INSERTED.id
              VALUES (
                  @to, @hospital, @address, @period, @contract_type, @service_provided,
                  @bank_name, @account_name, @account_number, @ifsc_code, @branch, @staff_id, GETDATE(), @status
              )
          `);
      
      const invoiceId = invoiceResult.recordset[0].id;

      for (const item of parsedItems.data) {
          const itemRequest = new sql.Request(transaction);
          await itemRequest
              .input('description', sql.NVarChar, item.description)
              .input('qty', sql.Int, item.qty)
              .input('rate', sql.Decimal(18, 2), item.rate)
              .input('total', sql.Decimal(18, 2), item.qty * item.rate)
              .input('amount', sql.Decimal(18, 2), item.amount)
              .input('invoice_id', sql.Int, invoiceId)
              .input('staff_id', sql.NVarChar, staffId)
              .query(`
                  INSERT INTO invoice_staff (description, qty, rate, total, amount, invoice_id, staff_id)
                  VALUES (@description, @qty, @rate, @total, @amount, @invoice_id, @staff_id)
              `);
      }

      await transaction.commit();
  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Error saving invoice:', error);
      const dbError = error as Error;
      return { message: `Database Error: ${dbError.message}`, type: 'error' };
  }

  revalidatePath('/dashboard/invoices');
  const message = status === 'draft' ? "Invoice saved as draft." : "Invoice created successfully.";
  return { message: message, type: "success" };
}


export async function handleUpdateInvoice(prevState: { message: string, type?: string }, formData: FormData) {
  const id = formData.get('id') as string;
  const staffId = formData.get('staffId') as string;
  const to = formData.get('to') as string;
  const address = formData.get('address') as string;
  const period = formData.get('period') as string;
  const contract_type = formData.get('contract_type') as string;
  const service_provided = formData.get('service_provided') as string;
  const bank_name = formData.get('bank_name') as string;
  const account_name = formData.get('account_name') as string;
  const account_number = formData.get('account_number') as string;
  const ifsc_code = formData.get('ifsc_code') as string;
  const branch = formData.get('branch') as string;
  const itemsJson = formData.get('items') as string;
  const status = formData.get('status') as string;


  if (!id || !staffId || !itemsJson) {
      return { message: 'Missing required invoice data.', type: 'error' };
  }

  let transaction;
  try {
      const items = JSON.parse(itemsJson);
      const parsedItems = z.array(invoiceItemSchema).safeParse(items);
      if (!parsedItems.success) {
          return { message: 'Invalid invoice items format.', type: 'error' };
      }

      const db = await getDbPool();
      transaction = new sql.Transaction(db);
      await transaction.begin();

      // Update the main invoice record
      const invoiceRequest = new sql.Request(transaction);
      await invoiceRequest
          .input('id', sql.Int, Number(id))
          .input('to', sql.NVarChar, to)
          .input('address', sql.NVarChar, address)
          .input('period', sql.NVarChar, period)
          .input('contract_type', sql.NVarChar, contract_type)
          .input('service_provided', sql.NVarChar, service_provided)
          .input('bank_name', sql.NVarChar, bank_name)
          .input('account_name', sql.NVarChar, account_name)
          .input('account_number', sql.NVarChar, account_number)
          .input('ifsc_code', sql.NVarChar, ifsc_code)
          .input('branch', sql.NVarChar, branch)
          .input('staff_id', sql.NVarChar, staffId)
          .input('status', sql.NVarChar, status)
          .query(`
              UPDATE Invoices SET
                  "to" = @to,
                  address = @address,
                  period = @period,
                  contract_type = @contract_type,
                  service_provided = @service_provided,
                  bank_name = @bank_name,
                  account_name = @account_name,
                  account_number = @account_number,
                  ifsc_code = @ifsc_code,
                  branch = @branch,
                  staff_id = @staff_id,
                  status = @status
              WHERE id = @id
          `);
      
      // Delete old items
      const deleteItemsRequest = new sql.Request(transaction);
      await deleteItemsRequest
          .input('invoice_id', sql.Int, Number(id))
          .query('DELETE FROM invoice_staff WHERE invoice_id = @invoice_id');

      // Insert new items
      for (const item of parsedItems.data) {
          const itemRequest = new sql.Request(transaction);
          await itemRequest
              .input('description', sql.NVarChar, item.description)
              .input('qty', sql.Int, item.qty)
              .input('rate', sql.Decimal(18, 2), item.rate)
              .input('total', sql.Decimal(18, 2), item.qty * item.rate)
              .input('amount', sql.Decimal(18, 2), item.amount)
              .input('invoice_id', sql.Int, Number(id))
              .input('staff_id', sql.NVarChar, staffId)
              .query(`
                  INSERT INTO invoice_staff (description, qty, rate, total, amount, invoice_id, staff_id)
                  VALUES (@description, @qty, @rate, @total, @amount, @invoice_id, @staff_id)
              `);
      }

      await transaction.commit();
  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Error updating invoice:', error);
      const dbError = error as Error;
      return { message: `Database Error: ${dbError.message}`, type: 'error' };
  }

  revalidatePath('/dashboard/invoices');
  revalidatePath(`/dashboard/invoices/${id}/edit`);
  revalidatePath(`/dashboard/invoices/${id}/view`);
  return { message: "Invoice updated successfully.", type: "success" };
}
