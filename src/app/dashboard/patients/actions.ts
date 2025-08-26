
"use server";

import pool, { sql, poolConnect } from "@/lib/db";
import { Patient } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { z } from 'zod';

const patientSchema = z.object({
  name: z.string().min(1, "Full Name is required."),
  birth_date: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  email: z.string().email("Invalid email address.").min(1, "Email is required."),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  company_id: z.string().min(1, "Insurance Company is required."),
  policy_number: z.string().optional().nullable(),
  member_id: z.string().optional().nullable(),
  policy_start_date: z.string().optional().nullable(),
  policy_end_date: z.string().optional().nullable(),
});

const patientUpdateSchema = patientSchema.extend({
  id: z.string(),
});

export async function getPatients(): Promise<Patient[]> {
  try {
    await poolConnect;
    const result = await pool.request()
      .query(`
        SELECT p.id, p.name as fullName, p.email, p.phone as phoneNumber, p.policy_number as policyNumber, c.name as companyName
        FROM patients p
        LEFT JOIN companies c ON p.company_id = c.id
      `);
    return result.recordset as Patient[];
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching patients: ${dbError.message}`);
  }
}

export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query(`
        SELECT 
          p.*, 
          p.name as fullName, 
          p.phone as phoneNumber, 
          p.company_id as companyId,
          c.name as companyName,
          p.birth_date as dateOfBirth, 
          p.policy_number as policyNumber, 
          p.member_id as memberId, 
          p.policy_start_date as policyStartDate, 
          p.policy_end_date as policyEndDate 
        FROM patients p
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE p.id = @id
      `);
      
    if (result.recordset.length === 0) {
      return null;
    }
    const patientData = result.recordset[0];
    
    // Format dates to 'yyyy-MM-dd'
    if (patientData.dateOfBirth) patientData.dateOfBirth = new Date(patientData.dateOfBirth).toISOString().split('T')[0];
    if (patientData.policyStartDate) patientData.policyStartDate = new Date(patientData.policyStartDate).toISOString().split('T')[0];
    if (patientData.policyEndDate) patientData.policyEndDate = new Date(patientData.policyEndDate).toISOString().split('T')[0];

    return patientData as Patient;
  } catch (error) {
    console.error(`Error fetching patient with id ${id}:`, error);
    throw new Error("Failed to fetch patient from database.");
  }
}

export async function handleAddPatient(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = patientSchema.safeParse({
    name: formData.get("name"),
    birth_date: formData.get("birth_date") || null,
    gender: formData.get("gender") || null,
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    address: formData.get("address") || null,
    company_id: formData.get("company_id"),
    policy_number: formData.get("policy_number") || null,
    member_id: formData.get("member_id") || null,
    policy_start_date: formData.get("policy_start_date") || null,
    policy_end_date: formData.get("policy_end_date") || null,
  });
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { data } = validatedFields;
  const id = `pat-${Date.now()}`;

  try {
    await poolConnect;
    const request = pool.request();
    request
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, data.name)
      .input('birth_date', data.birth_date ? sql.Date : sql.Date, data.birth_date ? new Date(data.birth_date) : null)
      .input('gender', sql.NVarChar, data.gender)
      .input('email', sql.NVarChar, data.email)
      .input('phone', sql.NVarChar, data.phone)
      .input('address', sql.NVarChar, data.address)
      .input('company_id', sql.NVarChar, data.company_id)
      .input('policy_number', sql.NVarChar, data.policy_number)
      .input('member_id', sql.NVarChar, data.member_id)
      .input('policy_start_date', data.policy_start_date ? sql.Date : sql.Date, data.policy_start_date ? new Date(data.policy_start_date) : null)
      .input('policy_end_date', data.policy_end_date ? sql.Date : sql.Date, data.policy_end_date ? new Date(data.policy_end_date) : null)

    await request.query(`
      INSERT INTO patients (id, name, birth_date, gender, email, phone, address, company_id, policy_number, member_id, policy_start_date, policy_end_date)
      VALUES (@id, @name, @birth_date, @gender, @email, @phone, @address, @company_id, @policy_number, @member_id, @policy_start_date, @policy_end_date)
    `);

  } catch (error) {
    console.error('Error adding patient:', error);
    const dbError = error as { message?: string };
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  revalidatePath('/dashboard/patients');
  return { message: "Patient added successfully.", type: "success" };
}

export async function handleUpdatePatient(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = patientUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    birth_date: formData.get("birth_date") || null,
    gender: formData.get("gender") || null,
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    address: formData.get("address") || null,
    company_id: formData.get("company_id"),
    policy_number: formData.get("policy_number") || null,
    member_id: formData.get("member_id") || null,
    policy_start_date: formData.get("policy_start_date") || null,
    policy_end_date: formData.get("policy_end_date") || null,
  });
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { id, ...data } = validatedFields.data;

  try {
    await poolConnect;
    const request = pool.request();
    request
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, data.name)
      .input('birth_date', data.birth_date ? sql.Date : sql.Date, data.birth_date ? new Date(data.birth_date) : null)
      .input('gender', sql.NVarChar, data.gender)
      .input('email', sql.NVarChar, data.email)
      .input('phone', sql.NVarChar, data.phone)
      .input('address', sql.NVarChar, data.address)
      .input('company_id', sql.NVarChar, data.company_id)
      .input('policy_number', sql.NVarChar, data.policy_number)
      .input('member_id', sql.NVarChar, data.member_id)
      .input('policy_start_date', data.policy_start_date ? sql.Date : sql.Date, data.policy_start_date ? new Date(data.policy_start_date) : null)
      .input('policy_end_date', data.policy_end_date ? sql.Date : sql.Date, data.policy_end_date ? new Date(data.policy_end_date) : null)

    await request.query(`
      UPDATE patients 
      SET name = @name, birth_date = @birth_date, gender = @gender, email = @email, phone = @phone, address = @address, 
          company_id = @company_id, policy_number = @policy_number, member_id = @member_id, 
          policy_start_date = @policy_start_date, policy_end_date = @policy_end_date
      WHERE id = @id
    `);

  } catch (error) {
    console.error('Error updating patient:', error);
    const dbError = error as { message?: string };
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  redirect(`/dashboard/patients/${id}/view`);
}


export async function handleDeletePatient(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
     if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    try {
        await poolConnect;
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM patients WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "Patient not found.", type: 'error' };
        }
    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/patients');
    return { message: "Patient deleted successfully.", type: 'success' };
}
