
"use server";

import { revalidatePath } from "next/cache";
import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { Staff } from "@/lib/types";

const staffSchema = z.object({
  name: z.string().min(1, "Full Name is the only required field."),
  password: z.string().min(6, "Password must be at least 6 characters"),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  joiningDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  shiftTime: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional().nullable(),
});

const staffUpdateSchema = staffSchema.extend({
    id: z.coerce.number().int().min(1),
    password: z.string().optional(),
});

export async function getStaff(): Promise<Staff[]> {
  try {
    await poolConnect;
    const result = await pool.request()
      .query('SELECT * FROM staff');
    return result.recordset as Staff[];
  } catch (error) {
      const dbError = error as Error;
      throw new Error(`Error fetching staff: ${dbError.message}`);
  }
}

export async function getStaffById(id: number): Promise<Staff | null> {
  try {
    await poolConnect;
    
    const [staffResult, hospitalsResult] = await Promise.all([
        pool.request()
          .input('id', sql.Int, id)
          .query('SELECT * FROM staff WHERE id = @id'),
        pool.request()
          .input('staff_id', sql.Int, id)
          .query('SELECT h.id, h.name FROM hospitals h JOIN hospital_staff hs ON h.id = hs.hospital_id WHERE hs.staff_id = @staff_id')
    ]);

    if (staffResult.recordset.length === 0) {
      return null;
    }
    
    const staff = staffResult.recordset[0] as Staff;
    staff.assignedHospitalsDetails = hospitalsResult.recordset;
    
    return staff;

  } catch (error) {
    console.error('Error fetching staff by ID:', error);
    throw new Error('Failed to fetch staff details from the database.');
  }
}


export async function handleAddStaff(prevState: { message: string, type?: string }, formData: FormData) {
  
  const validatedFields = staffSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    number: formData.get("number"),
    email: formData.get("email"),
    joiningDate: formData.get("joiningDate") || null,
    endDate: formData.get("endDate") || null,
    shiftTime: formData.get("shiftTime"),
    status: formData.get("status"),
  });
  
  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
      return {
          message: `Invalid data: ${errorMessages}`,
          type: 'error'
      };
  }

  const { data } = validatedFields;

  try {
    await poolConnect;
    await pool.request()
      .input('name', sql.NVarChar, data.name)
      .input('password', sql.NVarChar, data.password) // Add password
      .input('email', sql.NVarChar, data.email)
      .input('number', sql.NVarChar, data.number)
      .input('designation', sql.NVarChar, data.designation)
      .input('department', sql.NVarChar, data.department)
      .input('joiningDate', data.joiningDate ? sql.Date : sql.Date, data.joiningDate ? new Date(data.joiningDate) : null)
      .input('endDate', data.endDate ? sql.Date : sql.Date, data.endDate ? new Date(data.endDate) : null)
      .input('shiftTime', sql.NVarChar, data.shiftTime)
      .input('status', sql.NVarChar, data.status)
      .query(`
        INSERT INTO staff (name, password, email, number, designation, department, joiningDate, endDate, shiftTime, status) 
        VALUES (@name, @password, @email, @number, @designation, @department, @joiningDate, @endDate, @shiftTime, @status)
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
    password: formData.get("password") || undefined,
    designation: formData.get("designation"),
    department: formData.get("department"),
    number: formData.get("number"),
    email: formData.get("email"),
    joiningDate: formData.get("joiningDate") || null,
    endDate: formData.get("endDate") || null,
    shiftTime: formData.get("shiftTime"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
      return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { id, ...data } = parsed.data;

  try {
    await poolConnect;
    const request = pool.request();
    let setClauses = [
        `name = @name`,
        `email = @email`,
        `number = @number`,
        `designation = @designation`,
        `department = @department`,
        `joiningDate = @joiningDate`,
        `endDate = @endDate`,
        `shiftTime = @shiftTime`,
        `status = @status`,
    ];
    
    // Only add password to the update if it's provided
    if (data.password) {
        setClauses.push('password = @password');
        request.input('password', sql.NVarChar, data.password);
    }
    
    const result = await request
        .input('id', sql.Int, id)
        .input('name', sql.NVarChar, data.name)
        .input('email', sql.NVarChar, data.email)
        .input('number', sql.NVarChar, data.number)
        .input('designation', sql.NVarChar, data.designation)
        .input('department', sql.NVarChar, data.department)
        .input('joiningDate', data.joiningDate ? sql.Date : sql.Date, data.joiningDate ? new Date(data.joiningDate) : null)
        .input('endDate', data.endDate ? sql.Date : sql.Date, data.endDate ? new Date(data.endDate) : null)
        .input('shiftTime', sql.NVarChar, data.shiftTime)
        .input('status', sql.NVarChar, data.status)
        .query(`UPDATE staff SET ${setClauses.join(', ')} WHERE id = @id`);

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
            .input('id', sql.Int, Number(id))
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
