
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
    return { message: `Invalid data: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`, type: 'error' };
  }
  
  const { from, to, subject, details, requestType, patientId, totalExpectedCost } = validatedFields.data;
  let transaction;
  try {
    const db = await poolConnect;
    transaction = new sql.Transaction(db);
    await transaction.begin();

    // 1. Get latest patient details from admissions table
    const patientDetailsResult = await new sql.Request(transaction)
      .input('patient_id', sql.Int, patientId)
      .query('SELECT TOP 1 * FROM admissions WHERE patient_id = @patient_id ORDER BY id DESC');
    
    if (patientDetailsResult.recordset.length === 0) {
        throw new Error("No admission record found for this patient.");
    }
    const admissionDetails = patientDetailsResult.recordset[0];
    
    const patientResult = await new sql.Request(transaction)
        .input('id', sql.Int, patientId)
        .query('SELECT * FROM patients WHERE id = @id');
    const patientData = patientResult.recordset[0];
    
    const hospitalResult = await new sql.Request(transaction)
        .input('id', sql.NVarChar, admissionDetails.hospital_id)
        .query('SELECT name FROM hospitals WHERE id = @id');
    const hospitalName = hospitalResult.recordset[0]?.name;


    // 2. Insert into preauth_request
    const preAuthRequest = new sql.Request(transaction)
        .input('patient_id', sql.Int, patientId)
        .input('admission_id', sql.NVarChar, admissionDetails.admission_id)
        .input('first_name', sql.NVarChar, patientData.first_name)
        .input('last_name', sql.NVarChar, patientData.last_name)
        .input('email_address', sql.NVarChar, patientData.email_address)
        .input('phone_number', sql.NVarChar, patientData.phone_number)
        .input('alternative_number', sql.NVarChar, patientData.alternative_number)
        .input('gender', sql.NVarChar, patientData.gender)
        .input('age', sql.Int, patientData.age)
        .input('birth_date', sql.Date, patientData.birth_date)
        .input('address', sql.NVarChar, patientData.address)
        .input('occupation', sql.NVarChar, patientData.occupation)
        .input('employee_id', sql.NVarChar, patientData.employee_id)
        .input('abha_id', sql.NVarChar, patientData.abha_id)
        .input('health_id', sql.NVarChar, patientData.health_id)
        .input('photo', sql.NVarChar, patientData.photo)
        .input('adhaar_path', sql.NVarChar, patientData.adhaar_path)
        .input('pan_path', sql.NVarChar, patientData.pan_path)
        .input('passport_path', sql.NVarChar, patientData.passport_path)
        .input('voter_id_path', sql.NVarChar, patientData.voter_id_path)
        .input('driving_licence_path', sql.NVarChar, patientData.driving_licence_path)
        .input('other_path', sql.NVarChar, patientData.other_path)
        .input('relationship_policyholder', sql.NVarChar, admissionDetails.relationship_policyholder)
        .input('policy_number', sql.NVarChar, admissionDetails.policy_number)
        .input('insured_card_number', sql.NVarChar, admissionDetails.insured_card_number)
        .input('company_id', sql.NVarChar, admissionDetails.insurance_company)
        .input('policy_start_date', sql.Date, admissionDetails.policy_start_date)
        .input('policy_end_date', sql.Date, admissionDetails.policy_end_date)
        .input('sum_insured', sql.Decimal(18, 2), admissionDetails.sum_insured)
        .input('sum_utilized', sql.Decimal(18, 2), admissionDetails.sum_utilized)
        .input('total_sum', sql.Decimal(18, 2), admissionDetails.total_sum)
        .input('corporate_policy_number', sql.NVarChar, admissionDetails.corporate_policy_number)
        .input('other_policy_name', sql.NVarChar, admissionDetails.other_policy_name)
        .input('family_doctor_name', sql.NVarChar, admissionDetails.family_doctor_name)
        .input('family_doctor_phone', sql.NVarChar, admissionDetails.family_doctor_phone)
        .input('payer_email', sql.NVarChar, admissionDetails.payer_email)
        .input('payer_phone', sql.NVarChar, admissionDetails.payer_phone)
        .input('tpa_id', sql.Int, admissionDetails.tpa_id)
        .input('hospital_id', sql.NVarChar, admissionDetails.hospital_id)
        .input('hospital_name', sql.NVarChar, hospitalName)
        .input('doctor_id', sql.Int, admissionDetails.doctor_id)
        .input('treat_doc_name', sql.NVarChar, admissionDetails.treat_doc_name)
        .input('treat_doc_number', sql.NVarChar, admissionDetails.treat_doc_number)
        .input('treat_doc_qualification', sql.NVarChar, admissionDetails.treat_doc_qualification)
        .input('treat_doc_reg_no', sql.NVarChar, admissionDetails.treat_doc_reg_no)
        .input('natureOfIllness', sql.NVarChar, admissionDetails.natureOfIllness)
        .input('clinicalFindings', sql.NVarChar, admissionDetails.clinicalFindings)
        .input('ailmentDuration', sql.Int, admissionDetails.ailmentDuration)
        .input('firstConsultationDate', sql.Date, admissionDetails.firstConsultationDate)
        .input('pastHistory', sql.NVarChar, admissionDetails.pastHistory)
        .input('provisionalDiagnosis', sql.NVarChar, admissionDetails.provisionalDiagnosis)
        .input('icd10Codes', sql.NVarChar, admissionDetails.icd10Codes)
        .input('treatmentMedical', sql.NVarChar, admissionDetails.treatmentMedical)
        .input('treatmentSurgical', sql.NVarChar, admissionDetails.treatmentSurgical)
        .input('treatmentIntensiveCare', sql.NVarChar, admissionDetails.treatmentIntensiveCare)
        .input('treatmentInvestigation', sql.NVarChar, admissionDetails.treatmentInvestigation)
        .input('treatmentNonAllopathic', sql.NVarChar, admissionDetails.treatmentNonAllopathic)
        .input('investigationDetails', sql.NVarChar, admissionDetails.investigationDetails)
        .input('drugRoute', sql.NVarChar, admissionDetails.drugRoute)
        .input('procedureName', sql.NVarChar, admissionDetails.procedureName)
        .input('icd10PcsCodes', sql.NVarChar, admissionDetails.icd10PcsCodes)
        .input('otherTreatments', sql.NVarChar, admissionDetails.otherTreatments)
        .input('isInjury', sql.Bit, admissionDetails.isInjury)
        .input('injuryCause', sql.NVarChar, admissionDetails.injuryCause)
        .input('isRta', sql.Bit, admissionDetails.isRta)
        .input('injuryDate', sql.Date, admissionDetails.injuryDate)
        .input('isReportedToPolice', sql.Bit, admissionDetails.isReportedToPolice)
        .input('firNumber', sql.NVarChar, admissionDetails.firNumber)
        .input('isAlcoholSuspected', sql.Bit, admissionDetails.isAlcoholSuspected)
        .input('isToxicologyConducted', sql.Bit, admissionDetails.isToxicologyConducted)
        .input('isMaternity', sql.Bit, admissionDetails.isMaternity)
        .input('g', sql.Int, admissionDetails.g)
        .input('p', sql.Int, admissionDetails.p)
        .input('l', sql.Int, admissionDetails.l)
        .input('a', sql.Int, admissionDetails.a)
        .input('expectedDeliveryDate', sql.Date, admissionDetails.expectedDeliveryDate)
        .input('admissionDate', sql.Date, admissionDetails.admissionDate)
        .input('admissionTime', sql.NVarChar, admissionDetails.admissionTime)
        .input('admissionType', sql.NVarChar, admissionDetails.admissionType)
        .input('expectedStay', sql.Int, admissionDetails.expectedStay)
        .input('expectedIcuStay', sql.Int, admissionDetails.expectedIcuStay)
        .input('roomCategory', sql.NVarChar, admissionDetails.roomCategory)
        .input('roomNursingDietCost', sql.Decimal(18, 2), admissionDetails.roomNursingDietCost)
        .input('investigationCost', sql.Decimal(18, 2), admissionDetails.investigationCost)
        .input('icuCost', sql.Decimal(18, 2), admissionDetails.icuCost)
        .input('otCost', sql.Decimal(18, 2), admissionDetails.otCost)
        .input('professionalFees', sql.Decimal(18, 2), admissionDetails.professionalFees)
        .input('medicineCost', sql.Decimal(18, 2), admissionDetails.medicineCost)
        .input('otherHospitalExpenses', sql.Decimal(18, 2), admissionDetails.otherHospitalExpenses)
        .input('packageCharges', sql.Decimal(18, 2), admissionDetails.packageCharges)
        .input('totalExpectedCost', sql.Decimal(18, 2), totalExpectedCost)
        .input('patientDeclarationName', sql.NVarChar, admissionDetails.patientDeclarationName)
        .input('patientDeclarationContact', sql.NVarChar, admissionDetails.patientDeclarationContact)
        .input('patientDeclarationEmail', sql.NVarChar, admissionDetails.patientDeclarationEmail)
        .input('patientDeclarationDate', sql.Date, admissionDetails.patientDeclarationDate)
        .input('patientDeclarationTime', sql.NVarChar, admissionDetails.patientDeclarationTime)
        .input('hospitalDeclarationDoctorName', sql.NVarChar, admissionDetails.hospitalDeclarationDoctorName)
        .input('hospitalDeclarationDate', sql.Date, admissionDetails.hospitalDeclarationDate)
        .input('hospitalDeclarationTime', sql.NVarChar, admissionDetails.hospitalDeclarationTime)
        .input('attachments', sql.NVarChar, admissionDetails.attachments)
        .query(`INSERT INTO preauth_request (
            patient_id, admission_id, first_name, last_name, email_address, phone_number, alternative_number, gender, age, birth_date, address, occupation, employee_id, abha_id, health_id, photo, adhaar_path, pan_path, passport_path, voter_id_path, driving_licence_path, other_path, relationship_policyholder, policy_number, insured_card_number, company_id, policy_start_date, policy_end_date, sum_insured, sum_utilized, total_sum, corporate_policy_number, other_policy_name, family_doctor_name, family_doctor_phone, payer_email, payer_phone, tpa_id, hospital_id, hospital_name, doctor_id, treat_doc_name, treat_doc_number, treat_doc_qualification, treat_doc_reg_no, natureOfIllness, clinicalFindings, ailmentDuration, firstConsultationDate, pastHistory, provisionalDiagnosis, icd10Codes, treatmentMedical, treatmentSurgical, treatmentIntensiveCare, treatmentInvestigation, treatmentNonAllopathic, investigationDetails, drugRoute, procedureName, icd10PcsCodes, otherTreatments, isInjury, injuryCause, isRta, injuryDate, isReportedToPolice, firNumber, isAlcoholSuspected, isToxicologyConducted, isMaternity, g, p, l, a, expectedDeliveryDate, admissionDate, admissionTime, admissionType, expectedStay, expectedIcuStay, roomCategory, roomNursingDietCost, investigationCost, icuCost, otCost, professionalFees, medicineCost, otherHospitalExpenses, packageCharges, totalExpectedCost, patientDeclarationName, patientDeclarationContact, patientDeclarationEmail, patientDeclarationDate, patientDeclarationTime, hospitalDeclarationDoctorName, hospitalDeclarationDate, hospitalDeclarationTime, attachments
        ) OUTPUT INSERTED.id VALUES (
            @patient_id, @admission_id, @first_name, @last_name, @email_address, @phone_number, @alternative_number, @gender, @age, @birth_date, @address, @occupation, @employee_id, @abha_id, @health_id, @photo, @adhaar_path, @pan_path, @passport_path, @voter_id_path, @driving_licence_path, @other_path, @relationship_policyholder, @policy_number, @insured_card_number, @company_id, @policy_start_date, @policy_end_date, @sum_insured, @sum_utilized, @total_sum, @corporate_policy_number, @other_policy_name, @family_doctor_name, @family_doctor_phone, @payer_email, @payer_phone, @tpa_id, @hospital_id, @hospital_name, @doctor_id, @treat_doc_name, @treat_doc_number, @treat_doc_qualification, @treat_doc_reg_no, @natureOfIllness, @clinicalFindings, @ailmentDuration, @firstConsultationDate, @pastHistory, @provisionalDiagnosis, @icd10Codes, @treatmentMedical, @treatmentSurgical, @treatmentIntensiveCare, @treatmentInvestigation, @treatmentNonAllopathic, @investigationDetails, @drugRoute, @procedureName, @icd10PcsCodes, @otherTreatments, @isInjury, @injuryCause, @isRta, @injuryDate, @isReportedToPolice, @firNumber, @isAlcoholSuspected, @isToxicologyConducted, @isMaternity, @g, @p, @l, @a, @expectedDeliveryDate, @admissionDate, @admissionTime, @admissionType, @expectedStay, @expectedIcuStay, @roomCategory, @roomNursingDietCost, @investigationCost, @icuCost, @otCost, @professionalFees, @medicineCost, @otherHospitalExpenses, @packageCharges, @totalExpectedCost, @patientDeclarationName, @patientDeclarationContact, @patientDeclarationEmail, @patientDeclarationDate, @patientDeclarationTime, @hospitalDeclarationDoctorName, @hospitalDeclarationDate, @hospitalDeclarationTime, @attachments
        )`); // Add all fields
    const preAuthId = preAuthRequest.recordset[0].id;

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
                    pr.first_name + ' ' + pr.last_name as fullName,
                    c.subject,
                    c.to_email as email
                FROM preauth_request pr
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
                    pr.first_name + ' ' + pr.last_name as fullName,
                    c.body as details,
                    c.subject,
                    c.to_email as email,
                    c.from_email as fromEmail
                FROM preauth_request pr
                OUTER APPLY (
                    SELECT TOP 1 *
                    FROM chat 
                    WHERE preauth_id = pr.id 
                    ORDER BY created_at ASC
                ) c
                WHERE pr.id = @id
            `);
        if (result.recordset.length === 0) return null;
        
        const request = result.recordset[0];
        
        const companyResult = await pool.request()
            .input('company_id', sql.NVarChar, request.company_id)
            .query('SELECT name FROM companies WHERE id = @company_id');
        
        request.companyId = companyResult.recordset[0]?.name || request.company_id;

        return request as StaffingRequest;
    } catch (error) {
        console.error("Error fetching pre-auth request by ID:", error);
        throw new Error("Could not fetch pre-auth request details.");
    }
}


export async function handleDeleteRequest(formData: FormData) {
    const id = formData.get("id") as string;
    let transaction;
    try {
        const db = await poolConnect;
        transaction = new sql.Transaction(db);
        await transaction.begin();

        await new sql.Request(transaction).input('id', sql.Int, Number(id)).query('DELETE FROM chat WHERE preauth_id = @id');
        await new sql.Request(transaction).input('id', sql.Int, Number(id)).query('DELETE FROM medical WHERE preauth_id = @id');
        const result = await new sql.Request(transaction).input('id', sql.Int, Number(id)).query('DELETE FROM preauth_request WHERE id = @id');
        
        if (result.rowsAffected[0] === 0) {
           await transaction.rollback();
           throw new Error("Pre-auth request not found.");
        }
        
        await transaction.commit();
        
    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error("Error deleting pre-auth request:", error);
        throw new Error("Database error during deletion.");
    }
    revalidatePath('/dashboard/pre-auths');
}

export async function handleUpdateRequest(prevState: { message: string, type?:string }, formData: FormData) {
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
