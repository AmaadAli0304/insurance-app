
"use server";

import { revalidatePath } from "next/cache";
import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { TPA } from "@/lib/types";
import { redirect } from 'next/navigation';

const tpaSchema = z.object({
  name: z.string().min(1, "TPA name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  portalLink: z.string().url("Invalid URL").optional().or(z.literal('')),
});

const tpaUpdateSchema = tpaSchema.extend({
  id: z.coerce.number().int().min(1),
});

export async function getTPAs(): Promise<TPA[]> {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT * FROM tpas');
    // Map DB result to TPA type, especially for tpaId
    return result.recordset.map(record => ({ ...record, tpaId: String(record.id) }));
  } catch (error) {
    console.error('Error fetching TPAs:', error);
    const dbError = error as Error;
    throw new Error(`Error fetching TPAs: ${dbError.message}`);
  }
}

export async function getTPAById(id: number): Promise<TPA | null> {
  try {
    await poolConnect;
    const tpaResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM tpas WHERE id = @id');

    if (tpaResult.recordset.length === 0) {
      return null;
    }
    const tpa = tpaResult.recordset[0];
    
    const hospitalsResult = await pool.request()
      .input('tpa_id', sql.Int, id)
      .query('SELECT h.id, h.name FROM hospitals h JOIN hospital_tpas ht ON h.id = ht.hospital_id WHERE ht.tpa_id = @tpa_id');

    tpa.assignedHospitalsDetails = hospitalsResult.recordset;


    return { ...tpa, tpaId: String(tpa.id) };
  } catch (error) {
    console.error('Error fetching TPA by ID:', error);
    throw new Error('Failed to fetch TPA details from the database.');
  }
}

export async function handleAddTPA(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = tpaSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    portalLink: formData.get("portalLink"),
  });

  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
      return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }

  try {
    await poolConnect;
    await pool.request()
      .input('name', sql.NVarChar, validatedFields.data.name)
      .input('email', sql.NVarChar, validatedFields.data.email)
      .input('phone', sql.NVarChar, validatedFields.data.phone)
      .input('address', sql.NVarChar, validatedFields.data.address)
      .input('portalLink', sql.NVarChar, validatedFields.data.portalLink)
      .query(`
        INSERT INTO tpas (name, email, phone, address, portalLink) 
        VALUES (@name, @email, @phone, @address, @portalLink)
      `);
  } catch (error) {
    console.error('Error adding TPA:', error);
    const dbError = error as { message?: string };
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }

  revalidatePath('/dashboard/tpas');
  return { message: "TPA added successfully.", type: "success" };
}

export async function handleUpdateTPA(prevState: { message: string, type?: string }, formData: FormData) {
  const parsed = tpaUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    portalLink: formData.get("portalLink"),
  });

  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { id, ...updatedData } = parsed.data;

  try {
    await poolConnect;
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
      .input('id', sql.Int, id)
      .query(`UPDATE tpas SET ${setClauses} WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return { message: "TPA not found or data is the same.", type: 'error' };
    }
  } catch (error) {
    console.error('Database error:', error);
    return { message: "Failed to update TPA in the database.", type: 'error' };
  }

  revalidatePath('/dashboard/tpas');
  return { message: "TPA updated successfully.", type: "success" };
}

export async function handleDeleteTPA(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    try {
        await poolConnect;
        const result = await pool.request()
            .input('id', sql.Int, Number(id))
            .query('DELETE FROM tpas WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "TPA not found.", type: 'error' };
        }
    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/tpas');
    return { message: "TPA deleted successfully.", type: 'success' };
}
