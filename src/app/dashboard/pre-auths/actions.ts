
"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import pool, { sql, poolConnect } from "@/lib/db";
import type { StaffingRequest } from "@/lib/types";
import { z } from 'zod';
import nodemailer from "nodemailer";

const preAuthSchema = z.object({
    patientId: z.coerce.number(),
    hospitalId: z.string().optional().nullable(),
    from: z.string().email(),
    to: z.string().email(),
    subject: z.string().min(1, "Subject is required"),
    details: z.string().min(1, "Email body is required"),
    requestType: z.string(),
    totalExpectedCost: z.coerce.number().optional().nullable(),
});

async function sendPreAuthEmail(requestData: { from: string, to: string, subject: string, html: string }) {
    const { 
        MAILTRAP_HOST, 
        MAILTRAP_PORT, 
        MAILTRAP_USER, 
        MAILTRAP_PASS 
    } = process.env;

    if (!MAILTRAP_HOST || !MAILTRAP_PORT || !MAILTRAP_USER || !MAILTRAP_PASS) {
        console.error("Mailtrap environment variables are not set.");
        throw new Error("Email service is not configured.");
    }
    
    const transporter = nodemailer.createTransport({
        host: MAILTRAP_HOST,
        port: Number(MAILTRAP_PORT),
        auth: {
          user: MAILTRAP_USER,
          pass: MAILTRAP_PASS
        }
    });

    await transporter.sendMail({
        from: `"${requestData.from}" <donotreply@onestop.com>`,
        to: requestData.to,
        subject: requestData.subject,
        html: requestData.html,
    });
}

export async function handleAddRequest(prevState: { message: string, type?:string }, formData: FormData) {
  const validatedFields = preAuthSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: `Invalid data: ${validatedFields.error.flatten().fieldErrors}`, type: 'error' };
  }
  
  const { from, to, subject, details, requestType, patientId } = validatedFields.data;

  let transaction;
  try {
    await poolConnect;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // 1. Get latest patient details from admissions table
    const patientDetailsResult = await new sql.Request(transaction)
      .input('patient_id', sql.Int, patientId)
      .query('SELECT TOP 1 * FROM admissions WHERE patient_id = @patient_id ORDER BY id DESC');
    
    if (patientDetailsResult.recordset.length === 0) {
        throw new Error("No admission record found for this patient.");
    }
    const admissionDetails = patientDetailsResult.recordset[0];
    
    // 2. Insert into preauth_request
    const preAuthRequest = new sql.Request(transaction);
    const preAuthResult = await preAuthRequest
        .input('patient_id', sql.Int, patientId)
        .input('admission_id', sql.NVarChar, admissionDetails.admission_id)
        // ... (copy all fields from admissionDetails to preAuthRequest inputs) ...
        .query(`INSERT INTO preauth_request (...) OUTPUT INSERTED.id VALUES (...)`); // Add all fields
    const preAuthId = preAuthResult.recordset[0].id;

    // 3. Insert into medical table (copying from chief_complaints)
    const complaintsResult = await new sql.Request(transaction)
        .input('patient_id', sql.Int, patientId)
        .query('SELECT * FROM chief_complaints WHERE patient_id = @patient_id');
        
    for (const complaint of complaintsResult.recordset) {
        await new sql.Request(transaction)
            .input('preauth_id', sql.Int, preAuthId)
            .input('complaint_name', sql.NVarChar, complaint.complaint_name)
            .input('duration_value', sql.NVarChar, complaint.duration_value)
            .input('duration_unit', sql.NVarChar, complaint.duration_unit)
            .query('INSERT INTO medical (preauth_id, complaint_name, duration_value, duration_unit) VALUES (@preauth_id, @complaint_name, @duration_value, @duration_unit)');
    }

    // 4. Insert into chat table
    await new sql.Request(transaction)
        .input('preauth_id', sql.Int, preAuthId)
        .input('from_email', sql.NVarChar, from)
        .input('to_email', sql.NVarChar, to)
        .input('subject', sql.NVarChar, subject)
        .input('body', sql.NVarChar, details)
        .input('request_type', sql.NVarChar, requestType)
        .query('INSERT INTO chat (preauth_id, from_email, to_email, subject, body, request_type) VALUES (@preauth_id, @from_email, @to_email, @subject, @body, @request_type)');
        
    // 5. Send email
    await sendPreAuthEmail({ from, to, subject, html: details });
    
    await transaction.commit();

  } catch(error) {
      if (transaction) await transaction.rollback();
      const err = error as Error;
      console.error("Failed to create pre-auth request:", err);
      return { message: `Failed to create request: ${err.message}`, type: 'error' };
  }

  revalidatePath('/dashboard/pre-auths');
  redirect('/dashboard/pre-auths');
}

export async function getPreAuthRequests(hospitalId: string | null | undefined): Promise<StaffingRequest[]> {
    if (!hospitalId) return [];
    try {
        await poolConnect;
        const result = await pool.request()
            .input('hospitalId', sql.NVarChar, hospitalId)
            .query(`
                SELECT 
                    pr.id, 
                    pr.patient_id as patientId, 
                    pr.hospital_id as hospitalId,
                    pr.status, 
                    pr.created_at as createdAt,
                    p.first_name + ' ' + p.last_name as fullName,
                    c.subject,
                    c.to_email as email
                FROM preauth_request pr
                JOIN patients p ON pr.patient_id = p.id
                OUTER APPLY (
                    SELECT TOP 1 subject, to_email 
                    FROM chat 
                    WHERE preauth_id = pr.id 
                    ORDER BY created_at ASC
                ) c
                WHERE pr.hospital_id = @hospitalId
                ORDER BY pr.created_at DESC
            `);
        return result.recordset as StaffingRequest[];
    } catch (error) {
        console.error("Error fetching pre-auth requests:", error);
        throw new Error("Could not fetch pre-auth requests from database.");
    }
}

export async function getPreAuthRequestById(id: string): Promise<StaffingRequest | null> {
    try {
        await poolConnect;
        const result = await pool.request()
            .input('id', sql.Int, Number(id))
            .query(`
                 SELECT 
                    pr.*, 
                    pr.patient_id as patientId,
                    c.body as details,
                    c.subject,
                    c.to_email as email,
                    c.from_email as fromEmail,
                    p.first_name + ' ' + p.last_name as fullName
                FROM preauth_request pr
                LEFT JOIN patients p ON pr.patient_id = p.id
                OUTER APPLY (
                    SELECT TOP 1 *
                    FROM chat 
                    WHERE preauth_id = pr.id 
                    ORDER BY created_at ASC
                ) c
                WHERE pr.id = @id
            `);
        if (result.recordset.length === 0) return null;
        return result.recordset[0] as StaffingRequest;
    } catch (error) {
        console.error("Error fetching pre-auth request by ID:", error);
        throw new Error("Could not fetch pre-auth request details.");
    }
}


export async function handleDeleteRequest(formData: FormData) {
    const id = formData.get("id") as string;
    let transaction;
    try {
        await poolConnect;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        await new sql.Request(transaction).input('id', sql.Int, Number(id)).query('DELETE FROM chat WHERE preauth_id = @id');
        await new sql.Request(transaction).input('id', sql.Int, Number(id)).query('DELETE FROM medical WHERE preauth_id = @id');
        await new sql.Request(transaction).input('id', sql.Int, Number(id)).query('DELETE FROM preauth_request WHERE id = @id');
        
        await transaction.commit();
        
    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error("Error deleting pre-auth request:", error);
        throw new Error("Database error during deletion.");
    }
    revalidatePath('/dashboard/pre-auths');
}

export async function handleUpdateRequest(prevState: { message: string, type?:string }, formData: FormData) {
    // This is a placeholder for a more complex update logic
    // For now, we'll just update the status
    const id = formData.get('id') as string;
    const status = formData.get('status') as 'Pending' | 'Approved' | 'Rejected';

    if (!id || !status) {
        return { message: 'Missing required fields for update.', type: 'error' };
    }

    try {
        await poolConnect;
        await pool.request()
            .input('id', sql.Int, Number(id))
            .input('status', sql.NVarChar, status)
            .query('UPDATE preauth_request SET status = @status WHERE id = @id');
    } catch (error) {
        console.error("Error updating pre-auth status:", error);
        return { message: 'Database error while updating status.', type: 'error' };
    }

    revalidatePath(`/dashboard/pre-auths/${id}/view`);
    revalidatePath('/dashboard/pre-auths');
    return { message: 'Status updated successfully.', type: 'success' };
}
