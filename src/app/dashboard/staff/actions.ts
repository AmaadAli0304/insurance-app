
"use server";

import { revalidatePath } from "next/cache";
import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { Staff, Hospital, UserRole } from "@/lib/types";

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
});

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().min(0, "Quantity must be positive."),
  rate: z.coerce.number().min(0, "Rate must be positive."),
});

const invoiceSchema = z.object({
  staffId: z.string(),
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  issueDate: z.string().min(1, "Issue date is required."),
  dueDate: z.string().min(1, "Due date is required."),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.preprocess((val) => {
    try {
      return JSON.parse(val as string);
    } catch {
      return [];
    }
  }, z.array(invoiceItemSchema)),
  tax: z.coerce.number().min(0).optional().default(0),
});


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
            SELECT u.*, u.uid as id, h.name as hospitalName
            FROM users u
            LEFT JOIN hospital_staff hs ON u.uid = hs.staff_id
            LEFT JOIN hospitals h ON hs.hospital_id = h.id
            WHERE u.uid = @uid AND u.role IN ('Admin', 'Hospital Staff')
          `);

    if (staffResult.recordset.length === 0) {
      return null;
    }
    
    const staff = staffResult.recordset[0] as Staff;
    
    const hospitalAssignmentResult = await db.request()
        .input('staff_id', sql.NVarChar, id)
        .query('SELECT hospital_id FROM hospital_staff WHERE staff_id = @staff_id');
        
    if (hospitalAssignmentResult.recordset.length > 0) {
        staff.hospitalId = hospitalAssignmentResult.recordset[0].hospital_id;
    } else {
        staff.hospitalId = null;
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
    
    if (data.role === 'Hospital Staff' && data.hospitalId && data.hospitalId !== 'none') {
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
  const parsed = staffUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    password: formData.get("password") || undefined,
    hospitalId: formData.get("hospitalId"),
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
  
  const { id: staffId, hospitalId, ...data } = parsed.data;
  let transaction;

  try {
    const db = await poolConnect;
    transaction = new sql.Transaction(db);
    await transaction.begin();

    const request = new sql.Request(transaction);
    let setClauses = [
        `name = @name`,
        `email = @email`,
        `role = @role`,
        `number = @number`,
        `designation = @designation`,
        `department = @department`,
        `joiningDate = @joiningDate`,
        `endDate = @endDate`,
        `shiftTime = @shiftTime`,
        `status = @status`
    ].filter(Boolean);
    
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

    if (data.password) {
        setClauses.push('password = @password');
        request.input('password', sql.NVarChar, data.password);
    }
    
    const result = await request.query(`UPDATE users SET ${setClauses.join(', ')} WHERE uid = @uid`);

    // Handle hospital assignment
    const assignmentRequest = new sql.Request(transaction);
    await assignmentRequest.input('staff_id', sql.NVarChar, staffId).query('DELETE FROM hospital_staff WHERE staff_id = @staff_id');
    
    if (data.role === 'Hospital Staff' && hospitalId && hospitalId !== 'none') {
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

        // Delete from hospital_staff first
        await new sql.Request(transaction).input('staff_id', sql.NVarChar, id).query('DELETE FROM hospital_staff WHERE staff_id = @staff_id');
        
        // Then delete from users
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
    
    return { message: "Staff member deleted successfully.", type: 'success' };
}

export async function handleSaveInvoice(prevState: { message: string, type?: string }, formData: FormData) {
  const parsed = invoiceSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }

  const { staffId, invoiceNumber, issueDate, dueDate, notes, terms, items, tax } = parsed.data;
  const status = formData.get('status') as 'draft' | 'sent';

  if (!status) {
      return { message: 'Invoice status is missing.', type: 'error' };
  }
  
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const total = subtotal * (1 + tax / 100);

  let transaction;
  try {
      const db = await poolConnect;
      transaction = new sql.Transaction(db);
      await transaction.begin();

      const invoiceRequest = new sql.Request(transaction);
      const invoiceResult = await invoiceRequest
          .input('invoice_number', sql.NVarChar, invoiceNumber)
          .input('staff_id', sql.NVarChar, staffId)
          .input('issue_date', sql.Date, new Date(issueDate))
          .input('due_date', sql.Date, new Date(dueDate))
          .input('subtotal', sql.Decimal(18, 2), subtotal)
          .input('tax', sql.Decimal(18, 2), tax)
          .input('total', sql.Decimal(18, 2), total)
          .input('notes', sql.NVarChar, notes)
          .input('terms', sql.NVarChar, terms)
          .input('status', sql.NVarChar, status)
          .query(`
              INSERT INTO invoices (invoice_number, staff_id, issue_date, due_date, subtotal, tax, total, notes, terms, status)
              OUTPUT INSERTED.id
              VALUES (@invoice_number, @staff_id, @issue_date, @due_date, @subtotal, @tax, @total, @notes, @terms, @status)
          `);
      
      const invoiceId = invoiceResult.recordset[0].id;

      if (!invoiceId) {
          throw new Error("Failed to create invoice or retrieve ID.");
      }

      for (const item of items) {
          const itemRequest = new sql.Request(transaction);
          await itemRequest
              .input('invoice_id', sql.Int, invoiceId)
              .input('description', sql.NVarChar, item.description)
              .input('quantity', sql.Int, item.quantity)
              .input('rate', sql.Decimal(18, 2), item.rate)
              .input('amount', sql.Decimal(18, 2), item.quantity * item.rate)
              .query(`
                  INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
                  VALUES (@invoice_id, @description, @quantity, @rate, @amount)
              `);
      }

      await transaction.commit();

  } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Database Error:', error);
      const dbError = error as { message?: string, number?: number };
      if (dbError.number === 2627) { // Unique constraint violation
        return { message: "Database Error: An invoice with this number already exists.", type: "error" };
      }
      return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  
  revalidatePath('/dashboard/staff');
  return { message: `Invoice successfully saved as ${status}.`, type: "success" };
}
