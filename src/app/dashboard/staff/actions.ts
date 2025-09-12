
"use server";

import { revalidatePath } from "next/cache";
import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { Staff, Hospital, UserRole } from "@/lib/types";
import { redirect } from 'next/navigation';

const staffSchema = z.object({
  name: z.string().min(1, "Full Name is required."),
  email: z.string().email("Invalid email address.").min(1, "Email is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(['Admin', 'Hospital Staff']),
  hospitalId: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  number: z.string().optional().nullable().refine((val) => !val || val === '' || /^\d{10}$/.test(val), {
    message: "Phone number must be exactly 10 digits.",
  }),
  joiningDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  shiftTime: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional().nullable(),
});

const staffUpdateSchema = staffSchema.extend({
    id: z.coerce.string(),
    password: z.string().optional(),
    hospitalId: z.string().optional().nullable(),
}).omit({ password: true });


export async function getStaff(): Promise<Staff[]> {
  try {
    const db = await poolConnect;
    const result = await db.request()
      .query(`
        SELECT u.uid as id, u.name, u.email, u.designation, u.department, u.status, u.role, h.name as hospitalName
        FROM users u
        LEFT JOIN hospital_staff hs ON u.uid = hs.staff_id
        LEFT JOIN hospitals h ON hs.hospital_id = h.id
        WHERE u.role IN ('Admin', 'Hospital Staff')
      `);
    return result.recordset as Staff[];
  } catch (error) {
      const dbError = error as Error;
      throw new Error(`Error fetching staff: ${dbError.message}`);
  }
}

export async function getHospitalsForForm(): Promise<Pick<Hospital, 'id' | 'name'>[]> {
  try {
    const db = await poolConnect;
    const result = await db.request().query('SELECT id, name FROM hospitals');
    return result.recordset.filter(h => h.id && h.id.trim() !== '');
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching hospitals for form: ${dbError.message}`);
  }
}

export async function getStaffById(id: string): Promise<Staff | null> {
  try {
    const db = await poolConnect;
    
    const staffResult = await db.request()
          .input('uid', sql.NVarChar, id)
          .query(`
            SELECT u.*, u.uid as id
            FROM users u
            WHERE u.uid = @uid AND u.role IN ('Admin', 'Hospital Staff')
          `);

    if (staffResult.recordset.length === 0) {
      return null;
    }
    
    const staff = staffResult.recordset[0] as Staff;
    
    const hospitalAssignmentResult = await db.request()
        .input('staff_id', sql.NVarChar, id)
        .query(`
            SELECT h.id as hospitalId, h.name as hospitalName 
            FROM hospital_staff hs
            JOIN hospitals h ON hs.hospital_id = h.id
            WHERE hs.staff_id = @staff_id
        `);
        
    if (hospitalAssignmentResult.recordset.length > 0) {
        staff.hospitalId = hospitalAssignmentResult.recordset[0].hospitalId;
        staff.hospitalName = hospitalAssignmentResult.recordset[0].hospitalName;
    } else {
        staff.hospitalId = null;
        staff.hospitalName = null;
    }

    return staff;

  } catch (error) {
    console.error('Error fetching staff by ID:', error);
    throw new Error('Failed to fetch staff details from the database.');
  }
}

export async function handleAddStaff(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    hospitalId: formData.get("hospitalId"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    number: formData.get("number"),
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
  const uid = `user-${Date.now()}`;
  let transaction;

  try {
    const db = await poolConnect;
    transaction = new sql.Transaction(db);
    await transaction.begin();

    const userRequest = new sql.Request(transaction);
    await userRequest
      .input('uid', sql.NVarChar, uid)
      .input('name', sql.NVarChar, data.name)
      .input('email', sql.NVarChar, data.email)
      .input('role', sql.NVarChar, data.role)
      .input('password', sql.NVarChar, data.password)
      .input('designation', sql.NVarChar, data.designation)
      .input('department', sql.NVarChar, data.department)
      .input('joiningDate', data.joiningDate ? sql.Date : sql.Date, data.joiningDate ? new Date(data.joiningDate) : null)
      .input('endDate', data.endDate ? sql.Date : sql.Date, data.endDate ? new Date(data.endDate) : null)
      .input('shiftTime', sql.NVarChar, data.shiftTime)
      .input('status', sql.NVarChar, data.status)
      .input('number', sql.NVarChar, data.number)
      .query(`
        INSERT INTO users (uid, name, email, role, password, designation, department, joiningDate, endDate, shiftTime, status, number) 
        VALUES (@uid, @name, @email, @role, @password, @designation, @department, @joiningDate, @endDate, @shiftTime, @status, @number)
      `);
    
    if (data.hospitalId && data.hospitalId !== 'none') {
      const assignmentRequest = new sql.Request(transaction);
      await assignmentRequest
        .input('staff_id', sql.NVarChar, uid)
        .input('hospital_id', sql.NVarChar, data.hospitalId)
        .query('INSERT INTO hospital_staff (staff_id, hospital_id) VALUES (@staff_id, @hospital_id)');
    }

    await transaction.commit();
    
  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Error adding staff:', error);
      const dbError = error as { message?: string, number?: number };
      if (dbError.number === 2627) {
        return { message: "A user with this email already exists.", type: "error" };
      }
      return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  
  revalidatePath('/dashboard/staff');
  return { message: "Staff member added successfully.", type: "success" };
}


export async function handleUpdateStaff(prevState: { message: string, type?: string }, formData: FormData) {
  const password = formData.get("password") as string;
  const validatedFields = staffUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    hospitalId: formData.get("hospitalId"),
    designation: formData.get("designation"),
    department: formData.get("department"),
    number: formData.get("number"),
    joiningDate: formData.get("joiningDate") || null,
    endDate: formData.get("endDate") || null,
    shiftTime: formData.get("shiftTime"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
      return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { id: staffId, hospitalId, ...data } = validatedFields.data;

  let transaction;

  try {
    const db = await poolConnect;
    transaction = new sql.Transaction(db);
    await transaction.begin();

    const request = new sql.Request(transaction);
    let setClauses = [
        `name = @name`, `email = @email`, `role = @role`, `number = @number`,
        `designation = @designation`, `department = @department`, `joiningDate = @joiningDate`,
        `endDate = @endDate`, `shiftTime = @shiftTime`, `status = @status`
    ];
    
    request
      .input('uid', sql.NVarChar, staffId)
      .input('name', sql.NVarChar, data.name)
      .input('email', sql.NVarChar, data.email)
      .input('role', sql.NVarChar, data.role)
      .input('number', sql.NVarChar, data.number)
      .input('designation', sql.NVarChar, data.designation)
      .input('department', sql.NVarChar, data.department)
      .input('joiningDate', data.joiningDate ? sql.Date : sql.Date, data.joiningDate ? new Date(data.joiningDate) : null)
      .input('endDate', data.endDate ? sql.Date : sql.Date, data.endDate ? new Date(data.endDate) : null)
      .input('shiftTime', sql.NVarChar, data.shiftTime)
      .input('status', sql.NVarChar, data.status);

    if (password && password.length >= 6) {
        setClauses.push('password = @password');
        request.input('password', sql.NVarChar, password);
    }
    
    await request.query(`UPDATE users SET ${setClauses.join(', ')} WHERE uid = @uid`);

    const deleteAssignmentRequest = new sql.Request(transaction);
    await deleteAssignmentRequest
      .input('staff_id', sql.NVarChar, staffId)
      .query('DELETE FROM hospital_staff WHERE staff_id = @staff_id');
    
    if (hospitalId && hospitalId !== 'none') {
      const newAssignmentRequest = new sql.Request(transaction);
      await newAssignmentRequest
        .input('staff_id', sql.NVarChar, staffId)
        .input('hospital_id', sql.NVarChar, hospitalId)
        .query('INSERT INTO hospital_staff (staff_id, hospital_id) VALUES (@staff_id, @hospital_id)');
    }

    await transaction.commit();

  } catch (error) {
    if (transaction) await transaction.rollback();
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
    let transaction;

    try {
        const db = await poolConnect;
        transaction = new sql.Transaction(db);
        await transaction.begin();

        await new sql.Request(transaction).input('staff_id', sql.NVarChar, id).query('DELETE FROM hospital_staff WHERE staff_id = @staff_id');
        
        const result = await new sql.Request(transaction)
            .input('uid', sql.NVarChar, id)
            .query("DELETE FROM users WHERE uid = @uid");

        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return { message: "Staff member not found.", type: 'error' };
        }

        await transaction.commit();

    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/staff');
    return { message: "Staff member deleted successfully.", type: 'success' };
}
