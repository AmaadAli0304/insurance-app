
"use server";

import { revalidatePath } from "next/cache";
import pool, { sql, poolConnect } from "@/lib/db";
import { z } from 'zod';
import { Staff, Hospital, UserRole } from "@/lib/types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logActivity } from '@/lib/activity-log';

const s3 = new S3Client({
  region: "ap-south-1", // change if needed
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const staffSchema = z.object({
  name: z.string().min(1, "Full Name is required."),
  email: z.string().email("Invalid email address.").min(1, "Email is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(['Admin', 'Hospital Staff', 'Company Admin']),
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
  photoUrl: z.string().optional().nullable(),
  photoName: z.string().optional().nullable(),
  userId: z.string(),
  userName: z.string(),
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
        SELECT u.uid as id, u.name, u.email, u.designation, u.department, u.status, u.role, u.photo, h.name as hospitalName
        FROM users u
        LEFT JOIN hospital_staff hs ON u.uid = hs.staff_id
        LEFT JOIN hospitals h ON hs.hospital_id = h.id
        WHERE u.role IN ('Admin', 'Hospital Staff', 'Company Admin')
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
            WHERE u.uid = @uid AND u.role IN ('Admin', 'Hospital Staff', 'Company Admin')
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

const createDocumentJson = (url: string | undefined | null, name: string | undefined | null): string | null => {
    if (url && name) {
        return JSON.stringify({ url, name });
    }
    if (url) {
        return JSON.stringify({ url, name: 'file' });
    }
    return null;
};


export async function handleAddStaff(prevState: { message: string, type?: string }, formData: FormData) {
  const formObject = Object.fromEntries(formData.entries());
  const validatedFields = staffSchema.safeParse(formObject);
  
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

    const photoJson = createDocumentJson(data.photoUrl, data.photoName);

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
      .input('photo', sql.NVarChar, photoJson)
      .query(`
        INSERT INTO users (uid, name, email, role, password, designation, department, joiningDate, endDate, shiftTime, status, number, photo) 
        VALUES (@uid, @name, @email, @role, @password, @designation, @department, @joiningDate, @endDate, @shiftTime, @status, @number, @photo)
      `);
    
    if (data.hospitalId && data.hospitalId !== 'none') {
      const assignmentRequest = new sql.Request(transaction);
      await assignmentRequest
        .input('staff_id', sql.NVarChar, uid)
        .input('hospital_id', sql.NVarChar, data.hospitalId)
        .query('INSERT INTO hospital_staff (staff_id, hospital_id) VALUES (@staff_id, @hospital_id)');
    }

    await transaction.commit();
    
    await logActivity({
        userId: data.userId,
        userName: data.userName,
        actionType: 'CREATE_STAFF',
        details: `Created new staff member: ${data.name}`,
        targetId: uid,
        targetType: 'Staff'
    });

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
  const formObject = Object.fromEntries(formData.entries());
  const validatedFields = staffUpdateSchema.safeParse(formObject);

  if (!validatedFields.success) {
      const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
      return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { id: staffId, hospitalId, userId, userName, ...data } = validatedFields.data;

  let transaction;

  try {
    const db = await poolConnect;
    transaction = new sql.Transaction(db);
    await transaction.begin();

    const photoJson = createDocumentJson(data.photoUrl, data.photoName);

    const request = new sql.Request(transaction);
    let setClauses = [
        `name = @name`, `email = @email`, `role = @role`, `number = @number`,
        `designation = @designation`, `department = @department`, `joiningDate = @joiningDate`,
        `endDate = @endDate`, `shiftTime = @shiftTime`, `status = @status`, `photo = @photo`
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
      .input('status', sql.NVarChar, data.status)
      .input('photo', sql.NVarChar, photoJson);

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

    await logActivity({
        userId,
        userName,
        actionType: 'UPDATE_STAFF',
        details: `Updated staff member: ${data.name}`,
        targetId: staffId,
        targetType: 'Staff'
    });

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
    const userId = formData.get('userId') as string;
    const userName = formData.get('userName') as string;
    const staffName = formData.get('staffName') as string;

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

        await logActivity({
            userId,
            userName,
            actionType: 'DELETE_STAFF',
            details: `Deleted staff member: ${staffName}`,
            targetId: id,
            targetType: 'Staff'
        });

    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/staff');
    return { message: "Staff member deleted successfully.", type: 'success' };
}

export async function getPresignedUrl(
    key: string,
    contentType: string
): Promise<{ url: string; publicUrl: string } | { error: string }> {
    try {
        const command = new PutObjectCommand({
            Bucket: "inurance-app",
            Key: key,
            ContentType: contentType,
            ACL: 'public-read',
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        const publicUrl = `https://inurance-app.s3.ap-south-1.amazonaws.com/${key}`;

        return { url, publicUrl };
    } catch (error: any) {
        console.error("Error generating presigned URL:", error);
        return { error: error.message };
    }
}
