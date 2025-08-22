
"use server";

import { revalidatePath } from "next/cache";
import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { Staff } from "@/lib/types";

const staffSchema = z.object({
  name: z.string().min(1, "Full Name is the only required field."),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  joiningDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  shiftTime: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional().nullable(),
  companyId: z.string(),
});

const staffUpdateSchema = staffSchema.extend({
    id: z.string().min(1),
});

export async function getStaff(companyId: string): Promise<Staff[]> {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('companyId', sql.NVarChar, companyId)
      .query('SELECT * FROM staff WHERE companyId = @companyId');
    return result.recordset as Staff[];
  } catch (error) {
      const dbError = error as Error;
      throw new Error(`Error fetching staff: ${dbError.message}`);
  }
}

export async function getStaffById(id: string): Promise<Staff | null> {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM staff WHERE id = @id');

    if (result.recordset.length === 0) {
      return null;
    }
    
    return result.recordset[0] as Staff;

  } catch (error) {
    console.error('Error fetching staff by ID:', error);
    throw new Error('Failed to fetch staff details from the database.');
  }
}


export async function handleAddStaff(prevState: { message: string, type?: string }, formData: FormData) {
  
  const validatedFields = staffSchema.safeParse({
    name: formData.get("name"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    number: formData.get("number"),
    email: formData.get("email"),
    joiningDate: formData.get("joiningDate") || null,
    endDate: formData.get("endDate") || null,
    shiftTime: formData.get("shiftTime"),
    status: formData.get("status"),
    companyId: formData.get("companyId"),
  });
  
  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
      return {
          message: `Invalid data: ${errorMessages}`,
          type: 'error'
      };
  }

  const { data } = validatedFields;
  const id = `staff-${Date.now()}`;

  try {
    await poolConnect;
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, data.name)
      .input('email', sql.NVarChar, data.email)
      .input('number', sql.NVarChar, data.number)
      .input('designation', sql.NVarChar, data.designation)
      .input('department', sql.NVarChar, data.department)
      .input('joiningDate', data.joiningDate ? sql.Date : sql.Date, data.joiningDate ? new Date(data.joiningDate) : null)
      .input('endDate', data.endDate ? sql.Date : sql.Date, data.endDate ? new Date(data.endDate) : null)
      .input('shiftTime', sql.NVarChar, data.shiftTime)
      .input('status', sql.NVarChar, data.status)
      .input('companyId', sql.NVarChar, data.companyId)
      .query(`
        INSERT INTO staff (id, name, email, number, designation, department, joiningDate, endDate, shiftTime, status, companyId) 
        VALUES (@id, @name, @email, @number, @designation, @department, @joiningDate, @endDate, @shiftTime, @status, @companyId)
      `);
    
  } catch (error) {
      console.error('Error adding staff:', error);
      const dbError = error as { message?: string };
      return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  
  revalidatePath('/dashboard/staff');
  return { message: "Staff member added successfully.", type: "success" };
}


export async function handleUpdateStaff(prevState: { message: string, type?: string }, formData: FormData) {
  const parsed = staffUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    number: formData.get("number"),
    email: formData.get("email"),
    joiningDate: formData.get("joiningDate") || null,
    endDate: formData.get("endDate") || null,
    shiftTime: formData.get("shiftTime"),
    status: formData.get("status"),
    companyId: formData.get("companyId"),
  });

  if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { id, ...data } = parsed.data;

  try {
    await poolConnect;
    const request = pool.request();
    const setClauses = [
        `name = @name`,
        `email = @email`,
        `number = @number`,
        `designation = @designation`,
        `department = @department`,
        `joiningDate = @joiningDate`,
        `endDate = @endDate`,
        `shiftTime = @shiftTime`,
        `status = @status`,
    ].join(', ');
    
    const result = await request
        .input('id', sql.NVarChar, id)
        .input('name', sql.NVarChar, data.name)
        .input('email', sql.NVarChar, data.email)
        .input('number', sql.NVarChar, data.number)
        .input('designation', sql.NVarChar, data.designation)
        .input('department', sql.NVarChar, data.department)
        .input('joiningDate', data.joiningDate ? sql.Date : sql.Date, data.joiningDate ? new Date(data.joiningDate) : null)
        .input('endDate', data.endDate ? sql.Date : sql.Date, data.endDate ? new Date(data.endDate) : null)
        .input('shiftTime', sql.NVarChar, data.shiftTime)
        .input('status', sql.NVarChar, data.status)
        .query(`UPDATE staff SET ${setClauses} WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return { message: "Staff member not found or data is the same.", type: 'error' };
    }
  } catch (error) {
    console.error('Database error:', error);
    return { message: "Failed to update staff member in the database.", type: 'error' };
  }

  revalidatePath('/dashboard/staff');
  return { message: "Staff member updated successfully.", type: "success" };
}


export async function handleDeleteStaff(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    try {
        await poolConnect;
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM staff WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "Staff member not found.", type: 'error' };
        }
    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/staff');
    return { message: "Staff member deleted successfully.", type: 'success' };
}
