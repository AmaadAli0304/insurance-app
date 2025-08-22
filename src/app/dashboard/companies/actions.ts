
"use server";

import { revalidatePath } from "next/cache";
import pool, { sql } from "@/lib/db";
import { z } from 'zod';
import { Company } from "@/lib/types";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  address: z.string().optional(),
  portalLink: z.string().url().optional().or(z.literal('')),
});

export async function getCompanies(): Promise<Company[]> {
  try {
    await pool.connect();
    const result = await pool.request().query('SELECT * FROM companies');
    return result.recordset as Company[];
  } catch (error) {
      const dbError = error as Error;
      throw new Error(`Failed to fetch companies. Please check server logs for details. Error: ${dbError.message}`);
  } finally {
      pool.close();
  }
}

export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    await pool.connect();
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM companies WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }
    
    return result.recordset[0] as Company;

  } catch (error) {
    console.error('Error fetching company by ID:', error);
    throw new Error('Failed to fetch company details from the database.');
  } finally {
      pool.close();
  }
}

export async function handleAddCompany(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = companySchema.safeParse({
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    portalLink: formData.get("portalLink"),
  });

  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
      return {
          message: `Invalid data: ${errorMessages}`,
          type: 'error'
      };
  }

  try {
    const id = `comp-${Date.now()}`;
    await pool.connect();
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, validatedFields.data.name)
      .input('contactPerson', sql.NVarChar, validatedFields.data.contactPerson)
      .input('phone', sql.NVarChar, validatedFields.data.phone)
      .input('email', sql.NVarChar, validatedFields.data.email)
      .input('address', sql.NVarChar, validatedFields.data.address)
      .input('portalLink', sql.NVarChar, validatedFields.data.portalLink)
      .query(`
        INSERT INTO companies (id, name, contactPerson, phone, email, address, portalLink) 
        VALUES (@id, @name, @contactPerson, @phone, @email, @address, @portalLink)
      `);
    
  } catch (error) {
      console.error('Error adding company:', error);
      const dbError = error as { message?: string };
      return { message: `Error adding company: ${dbError.message || 'Unknown error'}`, type: "error" };
  } finally {
    pool.close();
  }
  
  revalidatePath('/dashboard/companies');
  return { message: "Company added successfully.", type: "success" };
}


const companyUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  address: z.string().optional(),
  portalLink: z.string().url("Invalid URL").optional().or(z.literal('')),
});


export async function handleUpdateCompany(prevState: { message: string, type?: string }, formData: FormData) {
  const parsed = companyUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    portalLink: formData.get("portalLink"),
  });

  if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { id, ...updatedData } = parsed.data;

  try {
    await pool.connect();
    const request = pool.request();
    const setClauses = Object.entries(updatedData)
      .map(([key, value]) => (value !== null && value !== undefined && value !== '') ? `${key} = @${key}` : null)
      .filter(Boolean)
      .join(', ');

    if (!setClauses) {
      return { message: "No data to update.", type: "error" };
    }

    Object.entries(updatedData).forEach(([key, value]) => {
       if (value !== null && value !== undefined && value !== '') {
        request.input(key, value);
      }
    });

    const result = await request
      .input('id', sql.NVarChar, id)
      .query(`UPDATE companies SET ${setClauses} WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return { message: "Company not found or data is the same.", type: 'error' };
    }
  } catch (error) {
    console.error('Database error:', error);
    return { message: "Failed to update company in the database.", type: 'error' };
  } finally {
    pool.close();
  }

  revalidatePath('/dashboard/companies');
  return { message: "Company updated successfully.", type: "success" };
}

export async function handleDeleteCompany(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    try {
        await pool.connect();
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM companies WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "Company not found.", type: 'error' };
        }
    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    } finally {
      pool.close();
    }
    
    revalidatePath('/dashboard/companies');
    return { message: "Company deleted successfully.", type: 'success' };
}
