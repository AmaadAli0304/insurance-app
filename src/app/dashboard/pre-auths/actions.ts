
"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDbPool, sql } from "@/lib/db";
import type { StaffingRequest, PreAuthStatus } from "@/lib/types";
import { z } from 'zod';
import nodemailer from "nodemailer";

const preAuthSchema = z.object({
    patientId: z.coerce.number().optional().nullable(),
    claim_id: z.string().optional().nullable(),
    hospitalId: z.string().optional().nullable(),
    from: z.string().email().optional().nullable(),
    to: z.string().email().optional().nullable(),
    subject: z.string().optional().nullable(),
    details: z.string().optional().nullable(),
    requestType: z.string().optional().nullable(),
    totalExpectedCost: z.coerce.number().optional().nullable(),
    doctor_id: z.coerce.number().optional().nullable(),

    // Patient and Admission fields from the form
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    email_address: z.string().email().optional().nullable(),
    phone_number: z.string().optional().nullable(),
    alternative_number: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    age: z.coerce.number().optional().nullable(),
    birth_date: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    occupation: z.string().optional().nullable(),
    employee_id: z.string().optional().nullable(),
    abha_id: z.string().optional().nullable(),
    health_id: z.string().optional().nullable(),
    admission_id: z.string().optional().nullable(),
    relationship_policyholder: z.string().optional().nullable(),
    policy_number: z.string().optional().nullable(),
    insured_card_number: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(), // Company name comes from patient details
    policy_start_date: z.string().optional().nullable(),
    policy_end_date: z.string().optional().nullable(),
    sumInsured: z.coerce.number().optional().nullable(),
    sumUtilized: z.coerce.number().optional().nullable(),
    totalSum: z.coerce.number().optional().nullable(),
    corporate_policy_number: z.string().optional().nullable(),
    other_policy_name: z.string().optional().nullable(),
    family_doctor_name: z.string().optional().nullable(),
    family_doctor_phone: z.string().optional().nullable(),
    payer_email: z.string().email().optional().nullable(),
    payer_phone: z.string().optional().nullable(),
    tpaName: z.string().optional().nullable(), // TPA name comes from patient details
    treat_doc_name: z.string().optional().nullable(),
    treat_doc_number: z.string().optional().nullable(),
    treat_doc_qualification: z.string().optional().nullable(),
    treat_doc_reg_no: z.string().optional().nullable(),
    natureOfIllness: z.string().optional().nullable(),
    clinicalFindings: z.string().optional().nullable(),
    ailmentDuration: z.coerce.number().optional().nullable(),
    firstConsultationDate: z.string().optional().nullable(),
    pastHistory: z.string().optional().nullable(),
    provisionalDiagnosis: z.string().optional().nullable(),
    icd10Codes: z.string().optional().nullable(),
    treatmentMedical: z.string().optional().nullable(),
    treatmentSurgical: z.string().optional().nullable(),
    treatmentIntensiveCare: z.string().optional().nullable(),
    treatmentInvestigation: z.string().optional().nullable(),
    treatmentNonAllopathic: z.string().optional().nullable(),
    investigationDetails: z.string().optional().nullable(),
    drugRoute: z.string().optional().nullable(),
    procedureName: z.string().optional().nullable(),
    icd10PcsCodes: z.string().optional().nullable(),
    otherTreatments: z.string().optional().nullable(),
    isInjury: z.string().optional().nullable(),
    injuryCause: z.string().optional().nullable(),
    isRta: z.string().optional().nullable(),
    injuryDate: z.string().optional().nullable(),
    isReportedToPolice: z.string().optional().nullable(),
    firNumber: z.string().optional().nullable(),
    isAlcoholSuspected: z.string().optional().nullable(),
    isToxicologyConducted: z.string().optional().nullable(),
    isMaternity: z.string().optional().nullable(),
    g: z.coerce.number().optional().nullable(),
    p: z.coerce.number().optional().nullable(),
    l: z.coerce.number().optional().nullable(),
    a: z.coerce.number().optional().nullable(),
    expectedDeliveryDate: z.string().optional().nullable(),
    admissionDate: z.string().optional().nullable(),
    admissionTime: z.string().optional().nullable(),
    admissionType: z.string().optional().nullable(),
    expectedStay: z.coerce.number().optional().nullable(),
    expectedIcuStay: z.coerce.number().optional().nullable(),
    roomCategory: z.string().optional().nullable(),
    roomNursingDietCost: z.coerce.number().optional().nullable(),
    investigationCost: z.coerce.number().optional().nullable(),
    icuCost: z.coerce.number().optional().nullable(),
    otCost: z.coerce.number().optional().nullable(),
    professionalFees: z.coerce.number().optional().nullable(),
    medicineCost: z.coerce.number().optional().nullable(),
    otherHospitalExpenses: z.coerce.number().optional().nullable(),
    packageCharges: z.coerce.number().optional().nullable(),
    patientDeclarationName: z.string().optional().nullable(),
    patientDeclarationContact: z.string().optional().nullable(),
    patientDeclarationEmail: z.string().email().optional().nullable(),
    patientDeclarationDate: z.string().optional().nullable(),
    patientDeclarationTime: z.string().optional().nullable(),
    hospitalDeclarationDoctorName: z.string().optional().nullable(),
    hospitalDeclarationDate: z.string().optional().nullable(),
    hospitalDeclarationTime: z.string().optional().nullable(),
    attachments: z.array(z.string()).or(z.string()).optional(),
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


async function savePreAuthRequest(formData: FormData, status: PreAuthStatus, shouldSendEmail: boolean) {
  const formEntries = Object.fromEntries(formData.entries());
  // Handle checkbox arrays
  formEntries.attachments = formData.getAll('attachments');
  
  const data = formEntries;
  const { from, to, subject, details, requestType, patientId, totalExpectedCost, doctor_id, claim_id, userId } = data as Record<string, any>;

  if (!patientId) {
    return { message: 'Please select a patient before saving.', type: 'error' };
  }

  let transaction;
  try {
    const pool = await getDbPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

     // Fetch original patient admission details to get IDs (like company_id, tpa_id)
    const patientIdsRequest = new sql.Request(transaction);
    const patientIdsResult = await patientIdsRequest
      .input('patient_id', sql.Int, patientId)
      .query(`SELECT TOP 1 insurance_company, tpa_id FROM admissions WHERE patient_id = @patient_id ORDER BY id DESC`);

    if (patientIdsResult.recordset.length === 0) {
      throw new Error("Could not find admission details for the selected patient.");
    }
    const originalPatientRecord = patientIdsResult.recordset[0];


    if (shouldSendEmail && from && to && subject && details) {
      await sendPreAuthEmail({ from, to, subject, html: details });
    }
    
    const preAuthInsertRequest = new sql.Request(transaction);
    const preAuthRequestResult = await preAuthInsertRequest
        .input('patient_id', sql.Int, patientId)
        .input('admission_id', sql.NVarChar, data.admission_id)
        .input('claim_id', sql.NVarChar, claim_id)
        .input('doctor_id', sql.Int, doctor_id)
        .input('first_name', sql.NVarChar, data.first_name)
        .input('last_name', sql.NVarChar, data.last_name)
        .input('email_address', sql.NVarChar, data.email_address)
        .input('phone_number', sql.NVarChar, data.phone_number)
        .input('alternative_number', sql.NVarChar, data.alternative_number)
        .input('gender', sql.NVarChar, data.gender)
        .input('age', sql.Int, data.age)
        .input('birth_date', sql.Date, data.birth_date ? new Date(data.birth_date as string) : null)
        .input('address', sql.NVarChar, data.address)
        .input('occupation', sql.NVarChar, data.occupation)
        .input('employee_id', sql.NVarChar, data.employee_id)
        .input('abha_id', sql.NVarChar, data.abha_id)
        .input('health_id', sql.NVarChar, data.health_id)
        .input('relationship_policyholder', sql.NVarChar, data.relationship_policyholder)
        .input('policy_number', sql.NVarChar, data.policy_number)
        .input('insured_card_number', sql.NVarChar, data.insured_card_number)
        .input('company_id', sql.NVarChar, originalPatientRecord.insurance_company)
        .input('policy_start_date', sql.Date, data.policy_start_date ? new Date(data.policy_start_date as string) : null)
        .input('policy_end_date', sql.Date, data.policy_end_date ? new Date(data.policy_end_date as string) : null)
        .input('sum_insured', sql.Decimal(18, 2), data.sumInsured)
        .input('sum_utilized', sql.Decimal(18, 2), data.sumUtilized)
        .input('total_sum', sql.Decimal(18, 2), data.totalSum)
        .input('corporate_policy_number', sql.NVarChar, data.corporate_policy_number)
        .input('other_policy_name', sql.NVarChar, data.other_policy_name)
        .input('family_doctor_name', sql.NVarChar, data.family_doctor_name)
        .input('family_doctor_phone', sql.NVarChar, data.family_doctor_phone)
        .input('payer_email', sql.NVarChar, data.payer_email)
        .input('payer_phone', sql.NVarChar, data.payer_phone)
        .input('tpa_id', sql.Int, originalPatientRecord.tpa_id)
        .input('hospital_id', sql.NVarChar, data.hospitalId)
        .input('treat_doc_name', sql.NVarChar, data.treat_doc_name)
        .input('treat_doc_number', sql.NVarChar, data.treat_doc_number)
        .input('treat_doc_qualification', sql.NVarChar, data.treat_doc_qualification)
        .input('treat_doc_reg_no', sql.NVarChar, data.treat_doc_reg_no)
        .input('natureOfIllness', sql.NVarChar, data.natureOfIllness)
        .input('clinicalFindings', sql.NVarChar, data.clinicalFindings)
        .input('ailmentDuration', sql.Int, data.ailmentDuration)
        .input('firstConsultationDate', sql.Date, data.firstConsultationDate ? new Date(data.firstConsultationDate as string) : null)
        .input('pastHistory', sql.NVarChar, data.pastHistory)
        .input('provisionalDiagnosis', sql.NVarChar, data.provisionalDiagnosis)
        .input('icd10Codes', sql.NVarChar, data.icd10Codes)
        .input('treatmentMedical', sql.NVarChar, data.treatmentMedical)
        .input('treatmentSurgical', sql.NVarChar, data.treatmentSurgical)
        .input('treatmentIntensiveCare', sql.NVarChar, data.treatmentIntensiveCare)
        .input('treatmentInvestigation', sql.NVarChar, data.treatmentInvestigation)
        .input('treatmentNonAllopathic', sql.NVarChar, data.treatmentNonAllopathic)
        .input('investigationDetails', sql.NVarChar, data.investigationDetails)
        .input('drugRoute', sql.NVarChar, data.drugRoute)
        .input('procedureName', sql.NVarChar, data.procedureName)
        .input('icd10PcsCodes', sql.NVarChar, data.icd10PcsCodes)
        .input('otherTreatments', sql.NVarChar, data.otherTreatments)
        .input('isInjury', sql.Bit, data.isInjury === 'on' ? 1 : 0)
        .input('injuryCause', sql.NVarChar, data.injuryCause)
        .input('isRta', sql.Bit, data.isRta === 'on' ? 1 : 0)
        .input('injuryDate', sql.Date, data.injuryDate ? new Date(data.injuryDate as string) : null)
        .input('isReportedToPolice', sql.Bit, data.isReportedToPolice === 'on' ? 1 : 0)
        .input('firNumber', sql.NVarChar, data.firNumber)
        .input('isAlcoholSuspected', sql.Bit, data.isAlcoholSuspected === 'on' ? 1 : 0)
        .input('isToxicologyConducted', sql.Bit, data.isToxicologyConducted === 'on' ? 1 : 0)
        .input('isMaternity', sql.Bit, data.isMaternity === 'on' ? 1 : 0)
        .input('g', sql.Int, data.g)
        .input('p', sql.Int, data.p)
        .input('l', sql.Int, data.l)
        .input('a', sql.Int, data.a)
        .input('expectedDeliveryDate', sql.Date, data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate as string) : null)
        .input('admissionDate', sql.Date, data.admissionDate ? new Date(data.admissionDate as string) : null)
        .input('admissionTime', sql.NVarChar, data.admissionTime)
        .input('admissionType', sql.NVarChar, data.admissionType)
        .input('expectedStay', sql.Int, data.expectedStay)
        .input('expectedIcuStay', sql.Int, data.expectedIcuStay)
        .input('roomCategory', sql.NVarChar, data.roomCategory)
        .input('roomNursingDietCost', sql.Decimal(18, 2), data.roomNursingDietCost)
        .input('investigationCost', sql.Decimal(18, 2), data.investigationCost)
        .input('icuCost', sql.Decimal(18, 2), data.icuCost)
        .input('otCost', sql.Decimal(18, 2), data.otCost)
        .input('professionalFees', sql.Decimal(18, 2), data.professionalFees)
        .input('medicineCost', sql.Decimal(18, 2), data.medicineCost)
        .input('otherHospitalExpenses', sql.Decimal(18, 2), data.otherHospitalExpenses)
        .input('packageCharges', sql.Decimal(18, 2), data.packageCharges)
        .input('totalExpectedCost', sql.Decimal(18, 2), totalExpectedCost)
        .input('patientDeclarationName', sql.NVarChar, data.patientDeclarationName)
        .input('patientDeclarationContact', sql.NVarChar, data.patientDeclarationContact)
        .input('patientDeclarationEmail', sql.NVarChar, data.patientDeclarationEmail)
        .input('patientDeclarationDate', sql.Date, data.patientDeclarationDate ? new Date(data.patientDeclarationDate as string) : null)
        .input('patientDeclarationTime', sql.NVarChar, data.patientDeclarationTime)
        .input('hospitalDeclarationDoctorName', sql.NVarChar, data.hospitalDeclarationDoctorName)
        .input('hospitalDeclarationDate', sql.Date, data.hospitalDeclarationDate ? new Date(data.hospitalDeclarationDate as string) : null)
        .input('hospitalDeclarationTime', sql.NVarChar, data.hospitalDeclarationTime)
        .input('attachments', sql.NVarChar, Array.isArray(data.attachments) ? (data.attachments as string[]).join(',') : null)
        .query(`INSERT INTO preauth_request (
            patient_id, admission_id, claim_id, doctor_id, first_name, last_name, email_address, phone_number, alternative_number, gender, age, birth_date, address, occupation, employee_id, abha_id, health_id, relationship_policyholder, policy_number, insured_card_number, company_id, policy_start_date, policy_end_date, sum_insured, sum_utilized, total_sum, corporate_policy_number, other_policy_name, family_doctor_name, family_doctor_phone, payer_email, payer_phone, tpa_id, hospital_id, treat_doc_name, treat_doc_number, treat_doc_qualification, treat_doc_reg_no, natureOfIllness, clinicalFindings, ailmentDuration, firstConsultationDate, pastHistory, provisionalDiagnosis, icd10Codes, treatmentMedical, treatmentSurgical, treatmentIntensiveCare, treatmentInvestigation, treatmentNonAllopathic, investigationDetails, drugRoute, procedureName, icd10PcsCodes, otherTreatments, isInjury, injuryCause, isRta, injuryDate, isReportedToPolice, firNumber, isAlcoholSuspected, isToxicologyConducted, isMaternity, g, p, l, a, expectedDeliveryDate, admissionDate, admissionTime, admissionType, expectedStay, expectedIcuStay, roomCategory, roomNursingDietCost, investigationCost, icuCost, otCost, professionalFees, medicineCost, otherHospitalExpenses, packageCharges, totalExpectedCost, patientDeclarationName, patientDeclarationContact, patientDeclarationEmail, patientDeclarationDate, patientDeclarationTime, hospitalDeclarationDoctorName, hospitalDeclarationDate, hospitalDeclarationTime, attachments
        ) OUTPUT INSERTED.id VALUES (
            @patient_id, @admission_id, @claim_id, @doctor_id, @first_name, @last_name, @email_address, @phone_number, @alternative_number, @gender, @age, @birth_date, @address, @occupation, @employee_id, @abha_id, @health_id, @relationship_policyholder, @policy_number, @insured_card_number, @company_id, @policy_start_date, @policy_end_date, @sum_insured, @sum_utilized, @total_sum, @corporate_policy_number, @other_policy_name, @family_doctor_name, @family_doctor_phone, @payer_email, @payer_phone, @tpa_id, @hospital_id, @treat_doc_name, @treat_doc_number, @treat_doc_qualification, @treat_doc_reg_no, @natureOfIllness, @clinicalFindings, @ailmentDuration, @firstConsultationDate, @pastHistory, @provisionalDiagnosis, @icd10Codes, @treatmentMedical, @treatmentSurgical, @treatmentIntensiveCare, @treatmentInvestigation, @treatmentNonAllopathic, @investigationDetails, @drugRoute, @procedureName, @icd10PcsCodes, @otherTreatments, @isInjury, @injuryCause, @isRta, @injuryDate, @isReportedToPolice, @firNumber, @isAlcoholSuspected, @isToxicologyConducted, @isMaternity, @g, @p, @l, @a, @expectedDeliveryDate, @admissionDate, @admissionTime, @admissionType, @expectedStay, @expectedIcuStay, @roomCategory, @roomNursingDietCost, @investigationCost, @icuCost, @otCost, @professionalFees, @medicineCost, @otherHospitalExpenses, @packageCharges, @totalExpectedCost, @patientDeclarationName, @patientDeclarationContact, @patientDeclarationEmail, @patientDeclarationDate, @patientDeclarationTime, @hospitalDeclarationDoctorName, @hospitalDeclarationDate, @hospitalDeclarationTime, @attachments
        )`);
    
    if (preAuthRequestResult.recordset.length === 0) {
        throw new Error("Failed to create pre-auth request record or retrieve its ID.");
    }
    const preAuthId = preAuthRequestResult.recordset[0].id;

    // Update the status separately if the column exists
    const updateStatusRequest = new sql.Request(transaction);
    await updateStatusRequest
      .input('id', sql.Int, preAuthId)
      .input('status', sql.NVarChar, status)
      .query('UPDATE preauth_request SET status = @status WHERE id = @id')
      .catch(err => {
        // Suppress error if status column does not exist, as per user's schema
        if (!err.message.includes("Invalid column name 'status'")) {
          throw err;
        }
        console.log("Status column not found, skipping update. This is expected.");
      });

    const chatInsertRequest = new sql.Request(transaction);
    await chatInsertRequest
        .input('preauth_id', sql.Int, preAuthId)
        .input('from_email', sql.NVarChar, from)
        .input('to_email', sql.NVarChar, to)
        .input('subject', sql.NVarChar, subject)
        .input('body', sql.NVarChar, details)
        .input('request_type', sql.NVarChar, requestType)
        .query('INSERT INTO chat (preauth_id, from_email, to_email, subject, body, request_type) VALUES (@preauth_id, @from_email, @to_email, @subject, @body, @request_type)');
        
    // Create a corresponding claim
    const claimInsertRequest = new sql.Request(transaction);
    await claimInsertRequest
        .input('Patient_id', sql.Int, patientId)
        .input('Patient_name', sql.NVarChar, `${data.first_name} ${data.last_name}`)
        .input('admission_id', sql.NVarChar, data.admission_id)
        .input('status', sql.NVarChar, 'Pending')
        .input('created_by', sql.NVarChar, userId)
        .input('amount', sql.Decimal(18, 2), totalExpectedCost)
        .input('hospital_id', sql.NVarChar, data.hospitalId)
        .input('tpa_id', sql.Int, originalPatientRecord.tpa_id)
        .query('INSERT INTO claims (Patient_id, Patient_name, admission_id, status, created_by, amount, hospital_id, tpa_id) VALUES (@Patient_id, @Patient_name, @admission_id, @status, @created_by, @amount, @hospital_id, @tpa_id)');

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
        const pool = await getDbPool();
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
        const pool = await getDbPool();
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
                    c.from_email as fromEmail,
                    comp.name as companyName,
                    tpa.email as tpaEmail
                FROM preauth_request pr
                LEFT JOIN companies comp ON pr.company_id = comp.id
                LEFT JOIN tpas tpa ON pr.tpa_id = tpa.id
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
        const pool = await getDbPool();
        transaction = new sql.Transaction(pool);
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

export async function handleUpdateRequest(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get('id') as string;
    const status = formData.get('status') as PreAuthStatus;
    const claim_id = formData.get('claim_id') as string;
    const reason = formData.get('reason') as string;
    const amount_sanctioned = formData.get('amount_sanctioned') as string;
    const userId = formData.get('userId') as string;

    if (!id || !status) {
        return { message: 'Missing required fields for update.', type: 'error' };
    }

    let transaction;
    try {
        const pool = await getDbPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 1. Update the preauth_request table with status and claim_id
        const preAuthRequest = new sql.Request(transaction);
        let preAuthUpdateQuery = 'UPDATE preauth_request SET status = @status';
        preAuthRequest.input('id', sql.Int, Number(id))
                      .input('status', sql.NVarChar, status);
        
        if (claim_id) {
            preAuthUpdateQuery += ', claim_id = @claim_id';
            preAuthRequest.input('claim_id', sql.NVarChar, claim_id);
        }
        
        preAuthUpdateQuery += ' WHERE id = @id';
        await preAuthRequest.query(preAuthUpdateQuery);

        // 2. Fetch details from preauth_request to get admission_id
        const getPreAuthDetailsRequest = new sql.Request(transaction);
        const preAuthDetailsResult = await getPreAuthDetailsRequest
            .input('id', sql.Int, Number(id))
            .query('SELECT * FROM preauth_request WHERE id = @id');
            
        if (preAuthDetailsResult.recordset.length === 0) {
            throw new Error('Could not find the pre-authorization request.');
        }
        const preAuthDetails = preAuthDetailsResult.recordset[0];
        
        // 3. Update all existing claims with the same admission_id
        if (claim_id && preAuthDetails.admission_id) {
            const updateClaimsRequest = new sql.Request(transaction);
            await updateClaimsRequest
                .input('admission_id', sql.NVarChar, preAuthDetails.admission_id)
                .input('claim_id', sql.NVarChar, claim_id)
                .query('UPDATE claims SET claim_id = @claim_id WHERE admission_id = @admission_id');
        }

        // 4. Create a new record in the claims table for history
        const claimInsertRequest = new sql.Request(transaction);
        await claimInsertRequest
            .input('Patient_id', sql.Int, preAuthDetails.patient_id)
            .input('Patient_name', sql.NVarChar, `${preAuthDetails.first_name} ${preAuthDetails.last_name}`)
            .input('admission_id', sql.NVarChar, preAuthDetails.admission_id)
            .input('status', sql.NVarChar, status) 
            .input('reason', sql.NVarChar, reason) 
            .input('created_by', sql.NVarChar, userId || 'System Update') 
            .input('amount', sql.Decimal(18, 2), preAuthDetails.totalExpectedCost)
            .input('paidAmount', sql.Decimal(18, 2), amount_sanctioned ? parseFloat(amount_sanctioned) : null) 
            .input('hospital_id', sql.NVarChar, preAuthDetails.hospital_id)
            .input('tpa_id', sql.Int, preAuthDetails.tpa_id)
            .input('claim_id', sql.NVarChar, claim_id) 
            .query(`
                INSERT INTO claims (
                    Patient_id, Patient_name, admission_id, status, reason, created_by, 
                    amount, paidAmount, hospital_id, tpa_id, claim_id, updated_at
                ) VALUES (
                    @Patient_id, @Patient_name, @admission_id, @status, @reason, @created_by, 
                    @amount, @paidAmount, @hospital_id, @tpa_id, @claim_id, GETDATE()
                )
            `);
        
        await transaction.commit();

    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error("Error updating pre-auth and creating claim:", error);
        const dbError = error as Error;
        return { message: `Database error: ${dbError.message}`, type: 'error' };
    }

    revalidatePath('/dashboard/pre-auths');
    revalidatePath('/dashboard/claims');
    return { message: 'Status updated and claim history recorded successfully.', type: 'success' };
}
