
"use server";

import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { TPA } from "@/lib/types";
import { redirect } from 'next/navigation';
import { logActivity } from "@/lib/activity-log";

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
    const db = await poolConnect;
    const result = await db.request().query('SELECT * FROM tpas');
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
    const db = await poolConnect;
    
    const [tpaResult, hospitalsResult] = await Promise.all([
        db.request()
          .input('id', sql.Int, id)
          .query('SELECT * FROM tpas WHERE id = @id'),
        db.request()
          .input('tpa_id', sql.Int, id)
          .query('SELECT h.id, h.name FROM hospitals h JOIN hospital_tpas ht ON h.id = ht.hospital_id WHERE ht.tpa_id = @tpa_id')
    ]);

    if (tpaResult.recordset.length === 0) {
      return null;
    }
    const tpa = tpaResult.recordset[0];
    tpa.assignedHospitalsDetails = hospitalsResult.recordset;


    return { ...tpa, tpaId: String(tpa.id) };
  } catch (error) {
    console.error('Error fetching TPA by ID:', error);
    throw new Error('Failed to fetch TPA details from the database.');
  }
}

export async function handleAddTPA(prevState: { message: string, type?: string }, formData: FormData) {
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;
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

  let tpaId;
  try {
    const db = await poolConnect;
    const result = await db.request()
      .input('name', sql.NVarChar, validatedFields.data.name)
      .input('email', sql.NVarChar, validatedFields.data.email)
      .input('phone', sql.NVarChar, validatedFields.data.phone)
      .input('address', sql.NVarChar, validatedFields.data.address)
      .input('portalLink', sql.NVarChar, validatedFields.data.portalLink)
      .query(`
        INSERT INTO tpas (name, email, phone, address, portalLink) 
        OUTPUT INSERTED.id
        VALUES (@name, @email, @phone, @address, @portalLink)
      `);
    tpaId = result.recordset[0].id;
  } catch (error) {
    console.error('Error adding TPA:', error);
    const dbError = error as { message?: string };
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  
  await logActivity({
    userId,
    userName,
    actionType: 'CREATE_TPA',
    details: `Created a new TPA: ${validatedFields.data.name}`,
    targetId: tpaId,
    targetType: 'TPA'
  });

  return { message: "TPA added successfully.", type: "success" };
}

export async function handleUpdateTPA(prevState: { message: string, type?: string }, formData: FormData) {
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;
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
    const db = await poolConnect;
    const request = db.request();
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
  
  await logActivity({
    userId,
    userName,
    actionType: 'UPDATE_TPA',
    details: `Updated TPA: ${parsed.data.name}`,
    targetId: parsed.data.id,
    targetType: 'TPA'
  });

  return { message: "TPA updated successfully.", type: "success" };
}

export async function handleDeleteTPA(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
    const userId = formData.get('userId') as string;
    const userName = formData.get('userName') as string;
    const tpaName = formData.get('tpaName') as string;

    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    try {
        const db = await poolConnect;
        const result = await db.request()
            .input('id', sql.Int, Number(id))
            .query('DELETE FROM tpas WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "TPA not found.", type: 'error' };
        }
    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }

    await logActivity({
        userId,
        userName,
        actionType: 'DELETE_TPA',
        details: `Deleted TPA: ${tpaName}`,
        targetId: id,
        targetType: 'TPA'
    });

    return { message: "TPA deleted successfully.", type: 'success' };
}
