

"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDbPool, sql } from "@/lib/db";
import type { StaffingRequest, PreAuthStatus, ChatMessage, Claim } from "@/lib/types";
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

async function sendPreAuthEmail(requestData: { 
    fromName: string, 
    fromEmail: string, 
    to: string, 
    subject: string, 
    html: string,
    attachments: { filename: string, content: Buffer, contentType: string }[] 
}) {
    const { 
        MAILTRAP_HOST, 
        MAILTRAP_PORT, 
        MAILTRAP_USER, 
        MAILTRAP_PASS 
    } = process.env;

    if (!MAILTRAP_HOST || !MAILTRAP_PORT || !MAILTRAP_USER || !MAILTRAP_PASS) {
        console.error("Mailtrap environment variables are not set.");
        throw new Error("Email service is not configured. Please check server environment variables.");
    }
    
    try {
        const transporter = nodemailer.createTransport({
            host: MAILTRAP_HOST,
            port: Number(MAILTRAP_PORT),
            auth: {
              user: MAILTRAP_USER,
              pass: MAILTRAP_PASS
            }
        });

        await transporter.sendMail({
            from: `"${requestData.fromName}" <${requestData.fromEmail}>`,
            to: requestData.to,
            subject: requestData.subject,
            html: requestData.html,
            attachments: requestData.attachments
        });
    } catch (error) {
        console.error("Failed to send email:", error);
        throw new Error("Failed to send email. Please check credentials and network.");
    }
}


async function savePreAuthRequest(formData: FormData, status: PreAuthStatus, shouldSendEmail: boolean) {
  const formEntries = Object.fromEntries(formData.entries());
  // Handle checkbox arrays
  formEntries.attachments = formData.getAll('attachments');
  const emailAttachmentsData = formData.getAll('email_attachments');
  
  const data = formEntries;
  const { subject, details, requestType, patientId, totalExpectedCost, doctor_id, claim_id, userId, hospitalId } = data as Record<string, any>;
  
  let transaction;
  try {
    const pool = await getDbPool();
    
    // Fetch hospital and TPA details in one go
    const detailsRequest = await pool.request()
      .input('hospitalId', sql.NVarChar, hospitalId)
      .input('patientId', sql.Int, patientId)
      .query(`
        SELECT 
          h.name as hospitalName, 
          h.email as hospitalEmail,
          t.email as tpaEmail,
          a.tpa_id as tpaId,
          a.insurance_company as companyId
        FROM hospitals h
        CROSS JOIN (SELECT TOP 1 tpa_id, insurance_company FROM admissions WHERE patient_id = @patientId ORDER BY id DESC) a
        LEFT JOIN tpas t ON a.tpa_id = t.id
        WHERE h.id = @hospitalId
      `);
      
    if (detailsRequest.recordset.length === 0) {
        throw new Error("Could not find hospital or patient admission details.");
    }
    
    const { hospitalName, hospitalEmail, tpaEmail, tpaId, companyId } = detailsRequest.recordset[0];
    const fromEmail = hospitalEmail;
    
    const parsedAttachments = emailAttachmentsData
            .map(att => typeof att === 'string' ? JSON.parse(att) : att);

    if (shouldSendEmail) {
        const fetchedAttachments = await Promise.all(
            parsedAttachments.map(async (att: { name: string, url: string }) => {
                try {
                    const response = await fetch(att.url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch attachment from ${att.url}`);
                    }
                    const buffer = await response.arrayBuffer();
                    const contentType = response.headers.get('content-type') || 'application/octet-stream';
                    return {
                        filename: att.name,
                        content: Buffer.from(buffer),
                        contentType: contentType
                    };
                } catch (fetchError) {
                    console.error(`Error fetching attachment ${att.name}:`, fetchError);
                    return null; // Return null for failed downloads
                }
            })
        );
        
        const validAttachments = fetchedAttachments.filter(att => att !== null) as { filename: string, content: Buffer, contentType: string }[];
        
        await sendPreAuthEmail({ 
            fromName: hospitalName, 
            fromEmail: fromEmail, 
            to: tpaEmail, 
            subject: subject, 
            html: details,
            attachments: validAttachments
        });
    }

    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const now = new Date();

    const preAuthInsertRequest = new sql.Request(transaction);
    const preAuthRequestResult = await preAuthInsertRequest
        .input('created_at', sql.DateTime, now)
        .input('patient_id', sql.Int, patientId)
        .input('admission_id', sql.NVarChar, data.admission_id)
        .input('claim_id', sql.NVarChar, claim_id)
        .input('doctor_id', sql.Int, doctor_id ? Number(doctor_id) : null)
        .input('first_name', sql.NVarChar, data.first_name)
        .input('last_name', sql.NVarChar, data.last_name)
        .input('email_address', sql.NVarChar, data.email_address)
        .input('phone_number', sql.NVarChar, data.phone_number)
        .input('alternative_number', sql.NVarChar, data.alternative_number)
        .input('gender', sql.NVarChar, data.gender)
        .input('age', sql.Int, data.age ? Number(data.age) : null)
        .input('birth_date', sql.Date, data.birth_date ? new Date(data.birth_date as string) : null)
        .input('address', sql.NVarChar, data.address)
        .input('occupation', sql.NVarChar, data.occupation)
        .input('employee_id', sql.NVarChar, data.employee_id)
        .input('abha_id', sql.NVarChar, data.abha_id)
        .input('health_id', sql.NVarChar, data.health_id)
        .input('relationship_policyholder', sql.NVarChar, data.relationship_policyholder)
        .input('policy_number', sql.NVarChar, data.policy_number)
        .input('insured_card_number', sql.NVarChar, data.insured_card_number)
        .input('company_id', sql.NVarChar, companyId)
        .input('policy_start_date', sql.Date, data.policy_start_date ? new Date(data.policy_start_date as string) : null)
        .input('policy_end_date', sql.Date, data.policy_end_date ? new Date(data.policy_end_date as string) : null)
        .input('sum_insured', sql.Decimal(18, 2), data.sumInsured ? Number(data.sumInsured) : null)
        .input('sum_utilized', sql.Decimal(18, 2), data.sumUtilized ? Number(data.sumUtilized) : null)
        .input('total_sum', sql.Decimal(18, 2), data.totalSum ? Number(data.totalSum) : null)
        .input('corporate_policy_number', sql.NVarChar, data.corporate_policy_number)
        .input('other_policy_name', sql.NVarChar, data.other_policy_name)
        .input('family_doctor_name', sql.NVarChar, data.family_doctor_name)
        .input('family_doctor_phone', sql.NVarChar, data.family_doctor_phone)
        .input('payer_email', sql.NVarChar, data.payer_email)
        .input('payer_phone', sql.NVarChar, data.payer_phone)
        .input('tpa_id', sql.Int, tpaId)
        .input('hospital_id', sql.NVarChar, data.hospitalId)
        .input('treat_doc_name', sql.NVarChar, data.treat_doc_name)
        .input('treat_doc_number', sql.NVarChar, data.treat_doc_number)
        .input('treat_doc_qualification', sql.NVarChar, data.treat_doc_qualification)
        .input('treat_doc_reg_no', sql.NVarChar, data.treat_doc_reg_no)
        .input('natureOfIllness', sql.NVarChar, data.natureOfIllness)
        .input('clinicalFindings', sql.NVarChar, data.clinicalFindings)
        .input('ailmentDuration', sql.Int, data.ailmentDuration ? Number(data.ailmentDuration) : null)
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
        .input('g', sql.Int, data.g ? Number(data.g) : null)
        .input('p', sql.Int, data.p ? Number(data.p) : null)
        .input('l', sql.Int, data.l ? Number(data.l) : null)
        .input('a', sql.Int, data.a ? Number(data.a) : null)
        .input('expectedDeliveryDate', sql.Date, data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate as string) : null)
        .input('admissionDate', sql.Date, data.admissionDate ? new Date(data.admissionDate as string) : null)
        .input('admissionTime', sql.NVarChar, data.admissionTime)
        .input('admissionType', sql.NVarChar, data.admissionType)
        .input('expectedStay', sql.Int, data.expectedStay ? Number(data.expectedStay) : null)
        .input('expectedIcuStay', sql.Int, data.expectedIcuStay ? Number(data.expectedIcuStay) : null)
        .input('roomCategory', sql.NVarChar, data.roomCategory)
        .input('roomNursingDietCost', sql.Decimal(18, 2), data.roomNursingDietCost ? Number(data.roomNursingDietCost) : null)
        .input('investigationCost', sql.Decimal(18, 2), data.investigationCost ? Number(data.investigationCost) : null)
        .input('icuCost', sql.Decimal(18, 2), data.icuCost ? Number(data.icuCost) : null)
        .input('otCost', sql.Decimal(18, 2), data.otCost ? Number(data.otCost) : null)
        .input('professionalFees', sql.Decimal(18, 2), data.professionalFees ? Number(data.professionalFees) : null)
        .input('medicineCost', sql.Decimal(18, 2), data.medicineCost ? Number(data.medicineCost) : null)
        .input('otherHospitalExpenses', sql.Decimal(18, 2), data.otherHospitalExpenses ? Number(data.otherHospitalExpenses) : null)
        .input('packageCharges', sql.Decimal(18, 2), data.packageCharges ? Number(data.packageCharges) : null)
        .input('totalExpectedCost', sql.Decimal(18, 2), totalExpectedCost ? Number(totalExpectedCost) : null)
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
            created_at, patient_id, admission_id, claim_id, doctor_id, first_name, last_name, email_address, phone_number, alternative_number, gender, age, birth_date, address, occupation, employee_id, abha_id, health_id, relationship_policyholder, policy_number, insured_card_number, company_id, policy_start_date, policy_end_date, sum_insured, sum_utilized, total_sum, corporate_policy_number, other_policy_name, family_doctor_name, family_doctor_phone, payer_email, payer_phone, tpa_id, hospital_id, treat_doc_name, treat_doc_number, treat_doc_qualification, treat_doc_reg_no, natureOfIllness, clinicalFindings, ailmentDuration, firstConsultationDate, pastHistory, provisionalDiagnosis, icd10Codes, treatmentMedical, treatmentSurgical, treatmentIntensiveCare, treatmentInvestigation, treatmentNonAllopathic, investigationDetails, drugRoute, procedureName, icd10PcsCodes, otherTreatments, isInjury, injuryCause, isRta, injuryDate, isReportedToPolice, firNumber, isAlcoholSuspected, isToxicologyConducted, isMaternity, g, p, l, a, expectedDeliveryDate, admissionDate, admissionTime, admissionType, expectedStay, expectedIcuStay, roomCategory, roomNursingDietCost, investigationCost, icuCost, otCost, professionalFees, medicineCost, otherHospitalExpenses, packageCharges, totalExpectedCost, patientDeclarationName, patientDeclarationContact, patientDeclarationEmail, patientDeclarationDate, patientDeclarationTime, hospitalDeclarationDoctorName, hospitalDeclarationDate, hospitalDeclarationTime, attachments
        ) OUTPUT INSERTED.id VALUES (
            @created_at, @patient_id, @admission_id, @claim_id, @doctor_id, @first_name, @last_name, @email_address, @phone_number, @alternative_number, @gender, @age, @birth_date, @address, @occupation, @employee_id, @abha_id, @health_id, @relationship_policyholder, @policy_number, @insured_card_number, @company_id, @policy_start_date, @policy_end_date, @sum_insured, @sum_utilized, @total_sum, @corporate_policy_number, @other_policy_name, @family_doctor_name, @family_doctor_phone, @payer_email, @payer_phone, @tpa_id, @hospital_id, @treat_doc_name, @treat_doc_number, @treat_doc_qualification, @treat_doc_reg_no, @natureOfIllness, @clinicalFindings, @ailmentDuration, @firstConsultationDate, @pastHistory, @provisionalDiagnosis, @icd10Codes, @treatmentMedical, @treatmentSurgical, @treatmentIntensiveCare, @treatmentInvestigation, @treatmentNonAllopathic, @investigationDetails, @drugRoute, @procedureName, @icd10PcsCodes, @otherTreatments, @isInjury, @injuryCause, @isRta, @injuryDate, @isReportedToPolice, @firNumber, @isAlcoholSuspected, @isToxicologyConducted, @isMaternity, @g, @p, @l, @a, @expectedDeliveryDate, @admissionDate, @admissionTime, @admissionType, @expectedStay, @expectedIcuStay, @roomCategory, @roomNursingDietCost, @investigationCost, @icuCost, @otCost, @professionalFees, @medicineCost, @otherHospitalExpenses, @packageCharges, @totalExpectedCost, @patientDeclarationName, @patientDeclarationContact, @patientDeclarationEmail, @patientDeclarationDate, @patientDeclarationTime, @hospitalDeclarationDoctorName, @hospitalDeclarationDate, @hospitalDeclarationTime, @attachments
        )`);
    
    if (preAuthRequestResult.recordset.length === 0) {
        throw new Error("Failed to create pre-auth request record or retrieve its ID.");
    }
    const preAuthId = preAuthRequestResult.recordset[0].id;

    const updateStatusRequest = new sql.Request(transaction);
    await updateStatusRequest
      .input('id', sql.Int, preAuthId)
      .input('status', sql.NVarChar, status)
      .query('UPDATE preauth_request SET status = @status WHERE id = @id');

    const chatInsertRequest = new sql.Request(transaction);
    const chatResult = await chatInsertRequest
        .input('preauth_id', sql.Int, preAuthId)
        .input('from_email', sql.NVarChar, fromEmail)
        .input('to_email', sql.NVarChar, tpaEmail)
        .input('subject', sql.NVarChar, subject)
        .input('body', sql.NVarChar, details)
        .input('request_type', sql.NVarChar, requestType)
        .input('created_at', sql.DateTime, now)
        .query('INSERT INTO chat (preauth_id, from_email, to_email, subject, body, request_type, created_at) OUTPUT INSERTED.id VALUES (@preauth_id, @from_email, @to_email, @subject, @body, @request_type, @created_at)');
    
    const chatId = chatResult.recordset[0]?.id;

    if (shouldSendEmail && chatId && parsedAttachments.length > 0) {
        for (const attachment of parsedAttachments) {
            const attachmentRequest = new sql.Request(transaction);
            await attachmentRequest
                .input('chat_id', sql.Int, chatId)
                .input('path', sql.NVarChar, JSON.stringify(attachment))
                .query('INSERT INTO chat_files (chat_id, path) VALUES (@chat_id, @path)');
        }
    }
        
    const claimInsertRequest = new sql.Request(transaction);
    await claimInsertRequest
        .input('Patient_id', sql.Int, patientId)
        .input('Patient_name', sql.NVarChar, `${data.first_name} ${data.last_name}`)
        .input('admission_id', sql.NVarChar, data.admission_id)
        .input('status', sql.NVarChar, 'Pre auth Sent')
        .input('created_by', sql.NVarChar, userId)
        .input('amount', sql.Decimal(18, 2), totalExpectedCost ? Number(totalExpectedCost) : null)
        .input('hospital_id', sql.NVarChar, data.hospitalId)
        .input('tpa_id', sql.Int, tpaId)
        .input('created_at', sql.DateTime, now)
        .input('updated_at', sql.DateTime, now)
        .query('INSERT INTO claims (Patient_id, Patient_name, admission_id, status, created_by, amount, hospital_id, tpa_id, created_at, updated_at) VALUES (@Patient_id, @Patient_name, @admission_id, @status, @created_by, @amount, @hospital_id, @tpa_id, @created_at, @updated_at)');

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
    return savePreAuthRequest(formData, 'Pre auth Sent', true);
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
                    p.photo as patientPhoto
                FROM preauth_request pr
                LEFT JOIN patients p ON pr.patient_id = p.id
                WHERE pr.hospital_id = @hospitalId
                ORDER BY pr.created_at DESC
            `);
        
        return result.recordset.map(record => {
            let photoUrl = null;
            if (record.patientPhoto) {
                try {
                    const parsedPhoto = JSON.parse(record.patientPhoto);
                    photoUrl = parsedPhoto.url;
                } catch (e) {
                    if (typeof record.patientPhoto === 'string' && record.patientPhoto.startsWith('http')) {
                        photoUrl = record.patientPhoto;
                    }
                }
            }
            return {
                ...record,
                patientPhoto: photoUrl
            };
        }) as StaffingRequest[];

    } catch (error) {
        console.error("Error fetching pre-auth requests:", error);
        throw new Error("Could not fetch pre-auth requests from database.");
    }
}

const getDocumentData = (jsonString: string | null | undefined): { url: string; name: string } | null => {
    if (!jsonString) return null;
    try {
        const parsed = JSON.parse(jsonString);
        if (typeof parsed === 'object' && parsed !== null && 'url' in parsed) {
            return { url: parsed.url, name: parsed.name || 'View Document' };
        }
    } catch (e) {
        if (typeof jsonString === 'string' && jsonString.startsWith('http')) {
            return { url: jsonString, name: 'View Document' };
        }
    }
    return null;
};


export async function getPreAuthRequestById(id: string): Promise<StaffingRequest | null> {
    try {
        const pool = await getDbPool();
        const requestResult = await pool.request()
            .input('id', sql.Int, Number(id))
            .query(`
                SELECT 
                    pr.*, 
                    pr.patient_id as patientId,
                    pr.first_name + ' ' + pr.last_name as fullName,
                    h.name as hospitalName,
                    h.email as fromEmail,
                    comp.name as companyName,
                    tpa.email as tpaEmail,
                    p.adhaar_path,
                    p.pan_path,
                    p.passport_path,
                    p.voter_id_path,
                    p.driving_licence_path,
                    p.other_path,
                    p.discharge_summary as discharge_summary_path,
                    p.final_bill as final_bill_path,
                    p.pharmacy_bill as pharmacy_bill_path,
                    p.implant_bill as implant_bill_stickers_path,
                    p.lab_bill as lab_bill_path,
                    p.ot_notes as ot_anesthesia_notes_path
                FROM preauth_request pr
                LEFT JOIN patients p ON pr.patient_id = p.id
                LEFT JOIN hospitals h ON pr.hospital_id = h.id
                LEFT JOIN companies comp ON pr.company_id = comp.id
                LEFT JOIN tpas tpa ON pr.tpa_id = tpa.id
                WHERE pr.id = @id
            `);
        
        if (requestResult.recordset.length === 0) return null;
        
        const request = requestResult.recordset[0];
        
        // Populate document fields
        request.adhaar_path = getDocumentData(request.adhaar_path);
        request.pan_path = getDocumentData(request.pan_path);
        request.passport_path = getDocumentData(request.passport_path);
        request.voter_id_path = getDocumentData(request.voter_id_path);
        request.driving_licence_path = getDocumentData(request.driving_licence_path);
        request.other_path = getDocumentData(request.other_path);
        request.discharge_summary_path = getDocumentData(request.discharge_summary_path);
        request.final_bill_path = getDocumentData(request.final_bill_path);
        request.pharmacy_bill_path = getDocumentData(request.pharmacy_bill_path);
        request.implant_bill_stickers_path = getDocumentData(request.implant_bill_stickers_path);
        request.lab_bill_path = getDocumentData(request.lab_bill_path);
        request.ot_anesthesia_notes_path = getDocumentData(request.ot_anesthesia_notes_path);


        const [chatResult, claimsResult] = await Promise.all([
             pool.request()
                .input('id', sql.Int, Number(id))
                .query('SELECT * FROM chat WHERE preauth_id = @id ORDER BY created_at DESC'),
            pool.request()
                .input('admission_id', sql.NVarChar, request.admission_id)
                .query(`SELECT id, status, reason, amount as claimAmount, updated_at FROM claims WHERE admission_id = @admission_id ORDER BY updated_at DESC`)
        ]);

        const chatHistory = chatResult.recordset as ChatMessage[];

        for (const chat of chatHistory) {
            const attachmentsResult = await pool.request()
                .input('chat_id', sql.Int, chat.id)
                .query('SELECT path FROM chat_files WHERE chat_id = @chat_id');
            
            chat.attachments = attachmentsResult.recordset.map(row => {
                try {
                    return JSON.parse(row.path);
                } catch {
                    return { name: "Invalid Attachment", url: "#" };
                }
            });
        }
        
        request.chatHistory = chatHistory;
        request.claimsHistory = claimsResult.recordset as Claim[];
        
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
    const amount_sanctioned_str = formData.get('amount_sanctioned') as string;
    const amount_sanctioned = amount_sanctioned_str ? parseFloat(amount_sanctioned_str) : null;
    const userId = formData.get('userId') as string;

    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const details = formData.get('details') as string;
    const emailAttachmentsData = formData.getAll('email_attachments');

    const statusesThatSendEmail = ['Query Answered', 'Enhancement Request', 'Final Discharge sent'];
    const statusesThatLogTpaResponse = ['Query Raised', 'Enhanced Amount', 'Final Amount Sanctioned'];
    
    let transaction;
    try {
        const pool = await getDbPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        const now = new Date();

        const getPreAuthDetailsRequest = new sql.Request(transaction);
        const preAuthDetailsResult = await getPreAuthDetailsRequest
            .input('id', sql.Int, Number(id))
            .query(`
                SELECT pr.*, t.email as tpaEmail, h.email as hospitalEmail, h.name as hospitalName
                FROM preauth_request pr
                LEFT JOIN tpas t ON pr.tpa_id = t.id
                LEFT JOIN hospitals h ON pr.hospital_id = h.id
                WHERE pr.id = @id
            `);

        if (preAuthDetailsResult.recordset.length === 0) {
            throw new Error('Could not find the pre-authorization request.');
        }
        const preAuthDetails = preAuthDetailsResult.recordset[0];
        const fullName = `${preAuthDetails.first_name} ${preAuthDetails.last_name}`;
        
        const parsedAttachments = emailAttachmentsData
            .map(att => typeof att === 'string' ? JSON.parse(att) : att);

        if (status === 'Amount received') {
            const tpaEmail = preAuthDetails.tpaEmail;
            const hospitalEmail = preAuthDetails.hospitalEmail;
            const tpaSubject = `[${status}] Regarding Pre-Auth for ${fullName} - Claim ID: ${claim_id || preAuthDetails.claim_id || 'N/A'}`;
            
            const chatInsertRequest = new sql.Request(transaction);
            await chatInsertRequest
                .input('preauth_id', sql.Int, Number(id))
                .input('from_email', sql.NVarChar, tpaEmail)
                .input('to_email', sql.NVarChar, hospitalEmail)
                .input('subject', sql.NVarChar, tpaSubject)
                .input('body', sql.NVarChar, reason)
                .input('request_type', sql.NVarChar, status)
                .input('created_at', sql.DateTime, now)
                .query('INSERT INTO chat (preauth_id, from_email, to_email, subject, body, request_type, created_at) VALUES (@preauth_id, @from_email, @to_email, @subject, @body, @request_type, @created_at)');
            
            const claimInsertRequest = new sql.Request(transaction);
            await claimInsertRequest
                .input('Patient_id', sql.Int, preAuthDetails.patient_id)
                .input('Patient_name', sql.NVarChar, fullName)
                .input('admission_id', sql.NVarChar, preAuthDetails.admission_id)
                .input('status', sql.NVarChar, status) 
                .input('reason', sql.NVarChar, reason) 
                .input('created_by', sql.NVarChar, userId || 'System Update') 
                .input('amount', sql.Decimal(18, 2), amount_sanctioned ? amount_sanctioned : preAuthDetails.totalExpectedCost)
                .input('paidAmount', sql.Decimal(18, 2), amount_sanctioned) 
                .input('hospital_id', sql.NVarChar, preAuthDetails.hospital_id)
                .input('tpa_id', sql.Int, preAuthDetails.tpa_id)
                .input('claim_id', sql.NVarChar, claim_id || preAuthDetails.claim_id) 
                .input('created_at', sql.DateTime, now)
                .input('updated_at', sql.DateTime, now)
                .query(`
                    INSERT INTO claims (
                        Patient_id, Patient_name, admission_id, status, reason, created_by, 
                        amount, paidAmount, hospital_id, tpa_id, claim_id, created_at, updated_at
                    ) VALUES (
                        @Patient_id, @Patient_name, @admission_id, @status, @reason, @created_by, 
                        @amount, @paidAmount, @hospital_id, @tpa_id, @claim_id, @created_at, @updated_at
                    )
                `);

            await transaction.commit();
            revalidatePath('/dashboard/pre-auths');
            revalidatePath('/dashboard/claims');
            return { message: 'Chat and Claim record created for amount received.', type: 'success' };
        }

        const shouldSendEmail = statusesThatSendEmail.includes(status);
        const shouldLogTpaResponse = statusesThatLogTpaResponse.includes(status);
        
        if (shouldSendEmail) {
            const fetchedAttachments = await Promise.all(
                parsedAttachments.map(async (att: { name: string, url: string }) => {
                    try {
                        const response = await fetch(att.url);
                        if (!response.ok) throw new Error(`Failed to fetch attachment from ${att.url}`);
                        const buffer = await response.arrayBuffer();
                        const contentType = response.headers.get('content-type') || 'application/octet-stream';
                        return { filename: att.name, content: Buffer.from(buffer), contentType };
                    } catch (fetchError) {
                        console.error(`Error fetching attachment ${att.name}:`, fetchError);
                        return null;
                    }
                })
            );
            
            await sendPreAuthEmail({ 
                fromName: preAuthDetails.hospitalName, 
                fromEmail: from, 
                to, 
                subject, 
                html: details,
                attachments: fetchedAttachments.filter(att => att !== null) as any
            });

            const chatInsertRequest = new sql.Request(transaction);
            const chatResult = await chatInsertRequest
                .input('preauth_id', sql.Int, Number(id))
                .input('from_email', sql.NVarChar, from)
                .input('to_email', sql.NVarChar, to)
                .input('subject', sql.NVarChar, subject)
                .input('body', sql.NVarChar, details)
                .input('request_type', sql.NVarChar, status)
                .input('created_at', sql.DateTime, now)
                .query('INSERT INTO chat (preauth_id, from_email, to_email, subject, body, request_type, created_at) OUTPUT INSERTED.id VALUES (@preauth_id, @from_email, @to_email, @subject, @body, @request_type, @created_at)');
        
            const chatId = chatResult.recordset[0]?.id;

            if (chatId && parsedAttachments.length > 0) {
                for (const attachment of parsedAttachments) {
                    const attachmentRequest = new sql.Request(transaction);
                    await attachmentRequest
                        .input('chat_id', sql.Int, chatId)
                        .input('path', sql.NVarChar, JSON.stringify(attachment))
                        .query('INSERT INTO chat_files (chat_id, path) VALUES (@chat_id, @path)');
                }
            }
        }

        if (shouldLogTpaResponse) {
            const tpaEmail = preAuthDetails.tpaEmail;
            const hospitalEmail = preAuthDetails.hospitalEmail;
            const tpaSubject = `[${status}] Regarding Pre-Auth for ${fullName} - Claim ID: ${claim_id || preAuthDetails.claim_id || 'N/A'}`;
            
            const chatInsertRequest = new sql.Request(transaction);
            await chatInsertRequest
                .input('preauth_id', sql.Int, Number(id))
                .input('from_email', sql.NVarChar, tpaEmail)
                .input('to_email', sql.NVarChar, hospitalEmail)
                .input('subject', sql.NVarChar, tpaSubject)
                .input('body', sql.NVarChar, reason)
                .input('request_type', sql.NVarChar, status)
                .input('created_at', sql.DateTime, now)
                .query('INSERT INTO chat (preauth_id, from_email, to_email, subject, body, request_type, created_at) VALUES (@preauth_id, @from_email, @to_email, @subject, @body, @request_type, @created_at)');
        }

        const preAuthRequest = new sql.Request(transaction);
        let preAuthUpdateQuery = 'UPDATE preauth_request SET status = @status, updated_at = @now, reason = @reason';
        preAuthRequest.input('id', sql.Int, Number(id))
                      .input('status', sql.NVarChar, status)
                      .input('reason', sql.NVarChar, reason)
                      .input('now', sql.DateTime, now);
        
        if (claim_id) {
            preAuthUpdateQuery += ', claim_id = @claim_id';
            preAuthRequest.input('claim_id', sql.NVarChar, claim_id);
        }
        
        preAuthUpdateQuery += ' WHERE id = @id';
        await preAuthRequest.query(preAuthUpdateQuery);

        if (claim_id && preAuthDetails.admission_id) {
            const updateClaimsRequest = new sql.Request(transaction);
            await updateClaimsRequest
                .input('admission_id', sql.NVarChar, preAuthDetails.admission_id)
                .input('claim_id', sql.NVarChar, claim_id)
                .query('UPDATE claims SET claim_id = @claim_id WHERE admission_id = @admission_id');
        }

        const claimInsertRequest = new sql.Request(transaction);
        await claimInsertRequest
            .input('Patient_id', sql.Int, preAuthDetails.patient_id)
            .input('Patient_name', sql.NVarChar, fullName)
            .input('admission_id', sql.NVarChar, preAuthDetails.admission_id)
            .input('status', sql.NVarChar, status) 
            .input('reason', sql.NVarChar, reason) 
            .input('created_by', sql.NVarChar, userId || 'System Update') 
            .input('amount', sql.Decimal(18, 2), amount_sanctioned ? amount_sanctioned : preAuthDetails.totalExpectedCost)
            .input('paidAmount', sql.Decimal(18, 2), amount_sanctioned) 
            .input('hospital_id', sql.NVarChar, preAuthDetails.hospital_id)
            .input('tpa_id', sql.Int, preAuthDetails.tpa_id)
            .input('claim_id', sql.NVarChar, claim_id) 
            .input('created_at', sql.DateTime, now)
            .input('updated_at', sql.DateTime, now)
            .query(`
                INSERT INTO claims (
                    Patient_id, Patient_name, admission_id, status, reason, created_by, 
                    amount, paidAmount, hospital_id, tpa_id, claim_id, created_at, updated_at
                ) VALUES (
                    @Patient_id, @Patient_name, @admission_id, @status, @reason, @created_by, 
                    @amount, @paidAmount, @hospital_id, @tpa_id, @claim_id, @created_at, @updated_at
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
