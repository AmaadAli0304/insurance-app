
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import pool, { sql } from "@/lib/db";
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  portalLink: z.string().url().optional().or(z.literal('')),
});

export async function handleAddCompany(prevState: { message: string, type?: string }, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    portalLink: formData.get("portalLink"),
  };

  const parsed = companySchema.safeParse(rawData);

  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: "error" };
  }

  const { name, contactPerson, phone, email, address, portalLink } = parsed.data;
  const id = `comp-${Date.now()}`;
  
  try {
    const request = pool.request();
    await request
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('contactPerson', sql.NVarChar, contactPerson || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('email', sql.NVarChar, email)
      .input('address', sql.NVarChar, address)
      .input('portalLink', sql.NVarChar, portalLink || null)
      .query(`
        INSERT INTO companies (id, name, contactPerson, phone, email, address, portalLink) 
        VALUES (@id, @name, @contactPerson, @phone, @email, @address, @portalLink)
      `);
  } catch (error) {
    console.error('Database error:', error);
    return { message: "Failed to add company to the database.", type: "error" };
  }
  
  revalidatePath('/dashboard/companies');
  redirect('/dashboard/companies');
}


const companyUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  address: z.string().optional(),
  portalLink: z.string().url().optional().or(z.literal('')),
});


export async function handleUpdateCompany(prevState: { message: string }, formData: FormData) {
  const rawData = {
    id: formData.get("id"),
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    portalLink: formData.get("portalLink"),
  };

  const parsed = companyUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return { message: `Invalid data: ${errorMessages}` };
  }
  
  const { id, ...updatedData } = parsed.data;

  try {
    const request = pool.request();
    const setClauses = Object.keys(updatedData).map(key => `${key} = @${key}`);
    
    Object.entries(updatedData).forEach(([key, value]) => {
      // Assuming appropriate sql types, adjust if necessary
      request.input(key, value || null);
    });

    const result = await request
      .input('id', sql.NVarChar, id)
      .query(`UPDATE companies SET ${setClauses.join(', ')} WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return { message: "Company not found or data is the same." };
    }
  } catch (error) {
    console.error('Database error:', error);
    return { message: "Failed to update company in the database." };
  }

  revalidatePath('/dashboard/companies');
  redirect('/dashboard/companies');
}

export async function handleDeleteCompany(formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      console.error("Delete error: ID is missing");
      return;
    }

    try {
        await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM companies WHERE id = @id');
    } catch (error) {
        console.error('Database error:', error);
        // Optionally, you could return an error message to be displayed.
    }
    
    revalidatePath('/dashboard/companies');
}
