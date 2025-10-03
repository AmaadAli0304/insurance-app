
"use server";

import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { Hospital } from "@/lib/types";

// Define the shape of a Doctor object
export type Doctor = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  qualification?: string | null;
  reg_no?: string | null;
  hospital_id?: string | null;
  hospitalName?: string | null;
}

// Zod schema for validation
const doctorSchema = z.object({
  name: z.string().min(1, "Doctor's name is required."),
  qualification: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().optional(),
  reg_no: z.string().optional(),
  hospitalId: z.string().optional().nullable(),
});

const doctorUpdateSchema = doctorSchema.extend({
    id: z.coerce.number().int().min(1),
});

// Fetch all doctors
export async function getDoctors(): Promise<Doctor[]> {
  try {
    const db = await poolConnect;
    const result = await db.request().query(`
        SELECT d.*, h.name as hospitalName 
        FROM doctors d
        LEFT JOIN hospitals h ON d.hospital_id = h.id
    `);
    return result.recordset as Doctor[];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    const dbError = error as Error;
    throw new Error(`Error fetching doctors: ${dbError.message}`);
  }
}

// Fetch a single doctor by ID
export async function getDoctorById(id: number): Promise<Doctor | null> {
    try {
        const db = await poolConnect;
        const result = await db.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM doctors WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return null;
        }
        return result.recordset[0] as Doctor;

    } catch (error) {
        console.error('Error fetching doctor by ID:', error);
        throw new Error('Failed to fetch doctor details from the database.');
    }
}

// Add a new doctor
export async function handleAddDoctor(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = doctorSchema.safeParse({
    name: formData.get("name"),
    qualification: formData.get("qualification"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    reg_no: formData.get("reg_no"),
    hospitalId: formData.get("hospitalId"),
  });

  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
      return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { name, qualification, email, phone, reg_no, hospitalId } = validatedFields.data;

  try {
    const db = await poolConnect;
    await db.request()
      .input('name', sql.NVarChar, name)
      .input('qualification', sql.NVarChar, qualification)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('reg_no', sql.NVarChar, reg_no)
      .input('hospital_id', sql.NVarChar, hospitalId === 'none' ? null : hospitalId)
      .query(`
        INSERT INTO doctors (name, qualification, email, phone, reg_no, hospital_id) 
        VALUES (@name, @qualification, @email, @phone, @reg_no, @hospital_id)
      `);
  } catch (error) {
    console.error('Error adding doctor:', error);
    const dbError = error as { message?: string };
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }

  return { message: "Doctor added successfully.", type: "success" };
}

// Update an existing doctor
export async function handleUpdateDoctor(prevState: { message: string, type?: string }, formData: FormData) {
  const parsed = doctorUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    qualification: formData.get("qualification"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    reg_no: formData.get("reg_no"),
    hospitalId: formData.get("hospitalId"),
  });
  
  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }

  const { id, hospitalId, ...dataToUpdate } = parsed.data;

  try {
    const db = await poolConnect;
    const request = db.request();
    const setClauses = Object.entries(dataToUpdate)
      .map(([key, value]) => (value != null && value !== '') ? `${key} = @${key}` : null)
      .filter(Boolean)
      .join(', ');
    
    setClauses.concat(', hospital_id = @hospital_id');

    if (!setClauses) {
      return { message: "No data to update.", type: "error" };
    }

    Object.entries(dataToUpdate).forEach(([key, value]) => {
      if (value != null && value !== '') {
        request.input(key, value);
      }
    });

    const result = await request
      .input('id', sql.Int, id)
      .input('hospital_id', sql.NVarChar, hospitalId === 'none' ? null : hospitalId)
      .query(`UPDATE doctors SET ${setClauses}, hospital_id = @hospital_id WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return { message: "Doctor not found or data is the same.", type: 'error' };
    }
  } catch (error) {
    console.error('Database error:', error);
    return { message: "Failed to update doctor in the database.", type: 'error' };
  }

  return { message: "Doctor updated successfully.", type: "success" };
}


// Delete a doctor
export async function handleDeleteDoctor(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    try {
        const db = await poolConnect;
        const result = await db.request()
            .input('id', sql.Int, Number(id))
            .query('DELETE FROM doctors WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "Doctor not found.", type: 'error' };
        }
    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    return { message: "Doctor deleted successfully.", type: 'success' };
}
