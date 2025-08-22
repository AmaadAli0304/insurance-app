
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import pool, { sql } from "@/lib/db";
import { z } from 'zod';
import { Company } from "@/lib/types";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  portalLink: z.string().url().optional().or(z.literal('')),
});

export async function getCompanies(): Promise<Company[]> {
  try {
    if (!pool.connected) {
      await pool.connect();
    }
    const result = await pool.request().query('SELECT * FROM companies');
    // The UI doesn't use assignedHospitals or policies on this page, 
    // so we can safely return them as empty.
    return result.recordset.map(record => ({
        ...record,
        assignedHospitals: [],
        policies: [],
    })) as Company[];
  } catch (error) {
      console.error('Error fetching companies from database:', error);
      // It's better to throw the error to be caught by the page component
      // This helps in displaying a proper error message to the user.
      const dbError = error as Error;
      throw new Error(`Failed to fetch companies. Please check server logs for details. Error: ${dbError.message}`);
  }
}

export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    if (!pool.connected) {
      await pool.connect();
    }
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM companies WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }
    
    const record = result.recordset[0];
    return {
        ...record,
        assignedHospitals: [], // Not needed for the edit form
        policies: [], // Not needed for the edit form
    } as Company;

  } catch (error) {
    console.error('Error fetching company by ID:', error);
    throw new Error('Failed to fetch company details from the database.');
  }
}


export async function handleAddCompany(prevState: { message: string, type?: string }, formData: FormData) {
  const name = formData.get("name") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const portalLink = formData.get("portalLink") as string;

  const validatedFields = companySchema.safeParse({
    name, contactPerson, phone, email, address, portalLink
  });

  if (!validatedFields.success) {
      return {
          message: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Invalid data provided.',
          type: 'error'
      };
  }

  try {
    const id = `comp-${Date.now()}`;
    
    if (!pool.connected) {
        await pool.connect();
    }
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('contactPerson', sql.NVarChar, contactPerson)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('address', sql.NVarChar, address)
      .input('portalLink', sql.NVarChar, portalLink)
      .query(`
        INSERT INTO companies (id, name, contactPerson, phone, email, address, portalLink) 
        VALUES (@id, @name, @contactPerson, @phone, @email, @address, @portalLink)
      `);
    
  } catch (error) {
      console.error('Error adding company:', error);
      const dbError = error as { message?: string };
      return { message: `Error adding company: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  
  revalidatePath('/dashboard/companies');
  return { message: "Company added successfully", type: "success" };
}


const companyUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  address: z.string().optional(),
  portalLink: z.string().url("Invalid URL").optional().or(z.literal('')),
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
    if (!pool.connected) {
      await pool.connect();
    }
    const request = pool.request();
    const setClauses = Object.entries(updatedData)
      .map(([key, value]) => value !== null && value !== '' ? `${key} = @${key}` : null)
      .filter(Boolean)
      .join(', ');

    if (!setClauses) {
      return { message: "No data to update." };
    }

    Object.entries(updatedData).forEach(([key, value]) => {
       if (value !== null && value !== '') {
        request.input(key, value);
      }
    });

    const result = await request
      .input('id', sql.NVarChar, id)
      .query(`UPDATE companies SET ${setClauses} WHERE id = @id`);

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
        if (!pool.connected) {
          await pool.connect();
        }
        await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM companies WHERE id = @id');
    } catch (error) {
        console.error('Database error:', error);
        // Optionally, you could return an error message to be displayed.
    }
    
    revalidatePath('/dashboard/companies');
}
