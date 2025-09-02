

"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import pool, { sql, poolConnect } from "@/lib/db";
import type { StaffingRequest } from "@/lib/types";
import { z } from 'zod';
import nodemailer from "nodemailer";

const preAuthSchema = z.object({
    patientId: z.coerce.number().optional().nullable(),
    hospitalId: z.string().optional().nullable(),
    from: z.string().email(),
    to: z.string().email(),
    subject: z.string().min(1, "Subject is required"),
    details: z.string().min(1, "Email body is required"),
    requestType: z.string(),
    totalExpectedCost: z.coerce.number().optional().nullable(),
    doctor_id: z.coerce.number().optional().nullable(),
});

const saveDraftSchema = preAuthSchema.extend({
    status: z.string().optional().default('Draft'),
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


async function savePreAuthRequest(formData: FormData, status: 'Pending' | 'Draft' = 'Pending', shouldSendEmail: boolean) {
  const validatedFields = saveDraftSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: `Invalid data: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`, type: 'error' };
  }
  
  const { from, to, subject, details, requestType, patientId, totalExpectedCost, doctor_id } = validatedFields.data;

  if (!patientId) {
    return { message: 'Please select a patient before saving.', type: 'error' };
  }

  let transaction;
  try {
    const db = await poolConnect;
    transaction = new sql.Transaction(db);
    await transaction.begin();

    const patientDetailsRequest = new sql.Request(transaction);
    const patientDetailsResult = await patientDetailsRequest
      .input('patient_id', sql.Int, patientId)
      .query(`
        SELECT TOP 1 
          p.*,
          a.id as admission_db_id, a.patient_id as admission_patient_id, a.admission_id, a.relationship_policyholder, a.policy_number,
          a.insured_card_number, a.insurance_company, a.policy_start_date, a.policy_end_date, a.sum_insured, a.sum_utilized,
          a.total_sum, a.corporate_policy_number, a.other_policy_name, a.family_doctor_name, a.family_doctor_phone,
          a.payer_email, a.payer_phone, a.tpa_id, a.hospital_id as admission_hospital_id, h.name as hospitalName, a.treat_doc_name,
          a.treat_doc_number, a.treat_doc_qualification, a.treat_doc_reg_no, a.natureOfIllness, a.clinicalFindings,
          a.ailmentDuration, a.firstConsultationDate, a.pastHistory, a.provisionalDiagnosis, a.icd10Codes, a.treatmentMedical,
          a.treatmentSurgical, a.treatmentIntensiveCare, a.treatmentInvestigation, a.treatmentNonAllopathic,
          a.investigationDetails, a.drugRoute, a.procedureName, a.icd10PcsCodes, a.otherTreatments, a.isInjury,
          a.injuryCause, a.isRta, a.injuryDate, a.isReportedToPolice, a.firNumber, a.isAlcoholSuspected,
          a.isToxicologyConducted, a.isMaternity, a.g, a.p, a.l, a.a, a.expectedDeliveryDate, a.admissionDate,
          a.admissionTime, a.admissionType, a.expectedStay, a.expectedIcuStay, a.roomCategory, a.roomNursingDietCost,
          a.investigationCost, a.icuCost, a.otCost, a.professionalFees, a.medicineCost, a.otherHospitalExpenses,
          a.packageCharges, a.totalExpectedCost as admissionTotalCost, a.patientDeclarationName, a.patientDeclarationContact,
          a.patientDeclarationEmail, a.patientDeclarationDate, a.patientDeclarationTime, a.hospitalDeclarationDoctorName,
          a.hospitalDeclarationDate, a.hospitalDeclarationTime, a.attachments
        FROM patients p
        LEFT JOIN admissions a ON p.id = a.patient_id
        LEFT JOIN hospitals h ON a.hospital_id = h.id
        WHERE p.id = @patient_id ORDER BY a.id DESC
      `);
    
    if (patientDetailsResult.recordset.length === 0) {
        throw new Error("No admission record found for this patient.");
    }
    const fullPatientData = patientDetailsResult.recordset[0];
    
    if (shouldSendEmail) {
      await sendPreAuthEmail({ from, to, subject, html: details });
    }

    const preAuthInsertRequest = new sql.Request(transaction);
    const preAuthRequestResult = await preAuthInsertRequest
        .input('patient_id', sql.Int, patientId)
        .input('admission_id', sql.NVarChar, fullPatientData.admission_id)
        .input('doctor_id', sql.Int, doctor_id)
        .input('status', sql.NVarChar, status)
        .input('first_name', sql.NVarChar, fullPatientData.first_name)
        .input('last_name', sql.NVarChar, fullPatientData.last_name)
        .input('email_address', sql.NVarChar, fullPatientData.email_address)
        .input('phone_number', sql.NVarChar, fullPatientData.phone_number)
        .input('alternative_number', sql.NVarChar, fullPatientData.alternative_number)
        .input('gender', sql.NVarChar, fullPatientData.gender)
        .input('age', sql.Int, fullPatientData.age)
        .input('birth_date', sql.Date, fullPatientData.birth_date)
        .input('address', sql.NVarChar, fullPatientData.address)
        .input('occupation', sql.NVarChar, fullPatientData.occupation)
        .input('employee_id', sql.NVarChar, fullPatientData.employee_id)
        .input('abha_id', sql.NVarChar, fullPatientData.abha_id)
        .input('health_id', sql.NVarChar, fullPatientData.health_id)
        .input('photo', sql.NVarChar, fullPatientData.photo)
        .input('adhaar_path', sql.NVarChar, fullPatientData.adhaar_path)
        .input('pan_path', sql.NVarChar, fullPatientData.pan_path)
        .input('passport_path', sql.NVarChar, fullPatientData.passport_path)
        .input('voter_id_path', sql.NVarChar, fullPatientData.voter_id_path)
        .input('driving_licence_path', sql.NVarChar, fullPatientData.driving_licence_path)
        .input('other_path', sql.NVarChar, fullPatientData.other_path)
        .input('relationship_policyholder', sql.NVarChar, fullPatientData.relationship_policyholder)
        .input('policy_number', sql.NVarChar, fullPatientData.policy_number)
        .input('insured_card_number', sql.NVarChar, fullPatientData.insured_card_number)
        .input('company_id', sql.NVarChar, fullPatientData.insurance_company)
        .input('policy_start_date', sql.Date, fullPatientData.policy_start_date)
        .input('policy_end_date', sql.Date, fullPatientData.policy_end_date)
        .input('sum_insured', sql.Decimal(18, 2), fullPatientData.sum_insured)
        .input('sum_utilized', sql.Decimal(18, 2), fullPatientData.sum_utilized)
        .input('total_sum', sql.Decimal(18, 2), fullPatientData.total_sum)
        .input('corporate_policy_number', sql.NVarChar, fullPatientData.corporate_policy_number)
        .input('other_policy_name', sql.NVarChar, fullPatientData.other_policy_name)
        .input('family_doctor_name', sql.NVarChar, fullPatientData.family_doctor_name)
        .input('family_doctor_phone', sql.NVarChar, fullPatientData.family_doctor_phone)
        .input('payer_email', sql.NVarChar, fullPatientData.payer_email)
        .input('payer_phone', sql.NVarChar, fullPatientData.payer_phone)
        .input('tpa_id', sql.Int, fullPatientData.tpa_id)
        .input('hospital_id', sql.NVarChar, fullPatientData.admission_hospital_id)
        .input('hospital_name', sql.NVarChar, fullPatientData.hospitalName)
        .input('treat_doc_name', sql.NVarChar, fullPatientData.treat_doc_name)
        .input('treat_doc_number', sql.NVarChar, fullPatientData.treat_doc_number)
        .input('treat_doc_qualification', sql.NVarChar, fullPatientData.treat_doc_qualification)
        .input('treat_doc_reg_no', sql.NVarChar, fullPatientData.treat_doc_reg_no)
        .input('natureOfIllness', sql.NVarChar, fullPatientData.natureOfIllness)
        .input('clinicalFindings', sql.NVarChar, fullPatientData.clinicalFindings)
        .input('ailmentDuration', sql.Int, fullPatientData.ailmentDuration)
        .input('firstConsultationDate', sql.Date, fullPatientData.firstConsultationDate)
        .input('pastHistory', sql.NVarChar, fullPatientData.pastHistory)
        .input('provisionalDiagnosis', sql.NVarChar, fullPatientData.provisionalDiagnosis)
        .input('icd10Codes', sql.NVarChar, fullPatientData.icd10Codes)
        .input('treatmentMedical', sql.NVarChar, fullPatientData.treatmentMedical)
        .input('treatmentSurgical', sql.NVarChar, fullPatientData.treatmentSurgical)
        .input('treatmentIntensiveCare', sql.NVarChar, fullPatientData.treatmentIntensiveCare)
        .input('treatmentInvestigation', sql.NVarChar, fullPatientData.treatmentInvestigation)
        .input('treatmentNonAllopathic', sql.NVarChar, fullPatientData.treatmentNonAllopathic)
        .input('investigationDetails', sql.NVarChar, fullPatientData.investigationDetails)
        .input('drugRoute', sql.NVarChar, fullPatientData.drugRoute)
        .input('procedureName', sql.NVarChar, fullPatientData.procedureName)
        .input('icd10PcsCodes', sql.NVarChar, fullPatientData.icd10PcsCodes)
        .input('otherTreatments', sql.NVarChar, fullPatientData.otherTreatments)
        .input('isInjury', sql.Bit, fullPatientData.isInjury)
        .input('injuryCause', sql.NVarChar, fullPatientData.injuryCause)
        .input('isRta', sql.Bit, fullPatientData.isRta)
        .input('injuryDate', sql.Date, fullPatientData.injuryDate)
        .input('isReportedToPolice', sql.Bit, fullPatientData.isReportedToPolice)
        .input('firNumber', sql.NVarChar, fullPatientData.firNumber)
        .input('isAlcoholSuspected', sql.Bit, fullPatientData.isAlcoholSuspected)
        .input('isToxicologyConducted', sql.Bit, fullPatientData.isToxicologyConducted)
        .input('isMaternity', sql.Bit, fullPatientData.isMaternity)
        .input('g', sql.Int, fullPatientData.g)
        .input('p', sql.Int, fullPatientData.p)
        .input('l', sql.Int, fullPatientData.l)
        .input('a', sql.Int, fullPatientData.a)
        .input('expectedDeliveryDate', sql.Date, fullPatientData.expectedDeliveryDate)
        .input('admissionDate', sql.Date, fullPatientData.admissionDate)
        .input('admissionTime', sql.NVarChar, fullPatientData.admissionTime)
        .input('admissionType', sql.NVarChar, fullPatientData.admissionType)
        .input('expectedStay', sql.Int, fullPatientData.expectedStay)
        .input('expectedIcuStay', sql.Int, fullPatientData.expectedIcuStay)
        .input('roomCategory', sql.NVarChar, fullPatientData.roomCategory)
        .input('roomNursingDietCost', sql.Decimal(18, 2), fullPatientData.roomNursingDietCost)
        .input('investigationCost', sql.Decimal(18, 2), fullPatientData.investigationCost)
        .input('icuCost', sql.Decimal(18, 2), fullPatientData.icuCost)
        .input('otCost', sql.Decimal(18, 2), fullPatientData.otCost)
        .input('professionalFees', sql.Decimal(18, 2), fullPatientData.professionalFees)
        .input('medicineCost', sql.Decimal(18, 2), fullPatientData.medicineCost)
        .input('otherHospitalExpenses', sql.Decimal(18, 2), fullPatientData.otherHospitalExpenses)
        .input('packageCharges', sql.Decimal(18, 2), fullPatientData.packageCharges)
        .input('totalExpectedCost', sql.Decimal(18, 2), totalExpectedCost)
        .input('patientDeclarationName', sql.NVarChar, fullPatientData.patientDeclarationName)
        .input('patientDeclarationContact', sql.NVarChar, fullPatientData.patientDeclarationContact)
        .input('patientDeclarationEmail', sql.NVarChar, fullPatientData.patientDeclarationEmail)
        .input('patientDeclarationDate', sql.Date, fullPatientData.patientDeclarationDate)
        .input('patientDeclarationTime', sql.NVarChar, fullPatientData.patientDeclarationTime)
        .input('hospitalDeclarationDoctorName', sql.NVarChar, fullPatientData.hospitalDeclarationDoctorName)
        .input('hospitalDeclarationDate', sql.Date, fullPatientData.hospitalDeclarationDate)
        .input('hospitalDeclarationTime', sql.NVarChar, fullPatientData.hospitalDeclarationTime)
        .input('attachments', sql.NVarChar, fullPatientData.attachments)
        .query(`INSERT INTO preauth_request (
            patient_id, admission_id, doctor_id, status, first_name, last_name, email_address, phone_number, alternative_number, gender, age, birth_date, address, occupation, employee_id, abha_id, health_id, photo, adhaar_path, pan_path, passport_path, voter_id_path, driving_licence_path, other_path, relationship_policyholder, policy_number, insured_card_number, company_id, policy_start_date, policy_end_date, sum_insured, sum_utilized, total_sum, corporate_policy_number, other_policy_name, family_doctor_name, family_doctor_phone, payer_email, payer_phone, tpa_id, hospital_id, hospital_name, treat_doc_name, treat_doc_number, treat_doc_qualification, treat_doc_reg_no, natureOfIllness, clinicalFindings, ailmentDuration, firstConsultationDate, pastHistory, provisionalDiagnosis, icd10Codes, treatmentMedical, treatmentSurgical, treatmentIntensiveCare, treatmentInvestigation, treatmentNonAllopathic, investigationDetails, drugRoute, procedureName, icd10PcsCodes, otherTreatments, isInjury, injuryCause, isRta, injuryDate, isReportedToPolice, firNumber, isAlcoholSuspected, isToxicologyConducted, isMaternity, g, p, l, a, expectedDeliveryDate, admissionDate, admissionTime, admissionType, expectedStay, expectedIcuStay, roomCategory, roomNursingDietCost, investigationCost, icuCost, otCost, professionalFees, medicineCost, otherHospitalExpenses, packageCharges, totalExpectedCost, patientDeclarationName, patientDeclarationContact, patientDeclarationEmail, patientDeclarationDate, patientDeclarationTime, hospitalDeclarationDoctorName, hospitalDeclarationDate, hospitalDeclarationTime, attachments
        ) OUTPUT INSERTED.id VALUES (
            @patient_id, @admission_id, @doctor_id, @status, @first_name, @last_name, @email_address, @phone_number, @alternative_number, @gender, @age, @birth_date, @address, @occupation, @employee_id, @abha_id, @health_id, @photo, @adhaar_path, @pan_path, @passport_path, @voter_id_path, @driving_licence_path, @other_path, @relationship_policyholder, @policy_number, @insured_card_number, @company_id, @policy_start_date, @policy_end_date, @sum_insured, @sum_utilized, @total_sum, @corporate_policy_number, @other_policy_name, @family_doctor_name, @family_doctor_phone, @payer_email, @payer_phone, @tpa_id, @hospital_id, @hospital_name, @treat_doc_name, @treat_doc_number, @treat_doc_qualification, @treat_doc_reg_no, @natureOfIllness, @clinicalFindings, @ailmentDuration, @firstConsultationDate, @pastHistory, @provisionalDiagnosis, @icd10Codes, @treatmentMedical, @treatmentSurgical, @treatmentIntensiveCare, @treatmentInvestigation, @treatmentNonAllopathic, @investigationDetails, @drugRoute, @procedureName, @icd10PcsCodes, @otherTreatments, @isInjury, @injuryCause, @isRta, @injuryDate, @isReportedToPolice, @firNumber, @isAlcoholSuspected, @isToxicologyConducted, @isMaternity, @g, @p, @l, @a, @expectedDeliveryDate, @admissionDate, @admissionTime, @admissionType, @expectedStay, @expectedIcuStay, @roomCategory, @roomNursingDietCost, @investigationCost, @icuCost, @otCost, @professionalFees, @medicineCost, @otherHospitalExpenses, @packageCharges, @totalExpectedCost, @patientDeclarationName, @patientDeclarationContact, @patientDeclarationEmail, @patientDeclarationDate, @patientDeclarationTime, @hospitalDeclarationDoctorName, @hospitalDeclarationDate, @hospitalDeclarationTime, @attachments
        )`);
    
    if (preAuthRequestResult.recordset.length === 0) {
        throw new Error("Failed to create pre-auth request record or retrieve its ID.");
    }
    const preAuthId = preAuthRequestResult.recordset[0].id;

    const complaintsResultRequest = new sql.Request(transaction);
    const complaintsResult = await complaintsResultRequest
        .input('patient_id', sql.Int, patientId)
        .query('SELECT * FROM chief_complaints WHERE patient_id = @patient_id');
        
    for (const complaint of complaintsResult.recordset) {
        const medicalInsertRequest = new sql.Request(transaction);
        await medicalInsertRequest
            .input('preauth_id', sql.Int, preAuthId)
            .input('complaint_name', sql.NVarChar, complaint.complaint_name)
            .input('duration_value', sql.NVarChar, complaint.duration_value)
            .input('duration_unit', sql.NVarChar, complaint.duration_unit)
            .query('INSERT INTO medical (preauth_id, complaint_name, duration_value, duration_unit) VALUES (@preauth_id, @complaint_name, @duration_value, @duration_unit)');
    }

    const chatInsertRequest = new sql.Request(transaction);
    await chatInsertRequest
        .input('preauth_id', sql.Int, preAuthId)
        .input('from_email', sql.NVarChar, from)
        .input('to_email', sql.NVarChar, to)
        .input('subject', sql.NVarChar, subject)
        .input('body', sql.NVarChar, details)
        .input('request_type', sql.NVarChar, requestType)
        .query('INSERT INTO chat (preauth_id, from_email, to_email, subject, body, request_type) VALUES (@preauth_id, @from_email, @to_email, @subject, @body, @request_type)');
        
    await transaction.commit();

  } catch(error) {
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error("Error during transaction rollback:", rollbackError);
        }
      }
      const err = error as Error;
      console.error("Failed to create pre-auth request:", err);
      return { message: `Failed to create request: ${err.message}`, type: 'error' };
  }

  revalidatePath('/dashboard/pre-auths');
  redirect('/dashboard/pre-auths');
}

export async function handleAddRequest(prevState: { message: string, type?:string }, formData: FormData) {
    return savePreAuthRequest(formData, 'Pending', true);
}

export async function handleSaveDraftRequest(prevState: { message: string, type?:string }, formData: FormData) {
    return savePreAuthRequest(formData, 'Draft', false);
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
    const status = formData.get('status') as 'Pending' | 'Approved' | 'Rejected' | 'Draft';

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





