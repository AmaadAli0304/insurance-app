

"use server";

import { getDbPool, sql } from "@/lib/db";
import { Patient, Company, TPA, Claim } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "ap-south-1", // change if needed
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const basePatientObjectSchema = z.object({
  // Patient Details
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  email_address: z.string().email("Invalid email address.").optional().nullable(),
  phone_number: z.string().optional().nullable(),
  alternative_number: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  employee_id: z.string().optional().nullable(),
  abha_id: z.string().optional().nullable(),
  health_id: z.string().optional().nullable(),
  
  photoUrl: z.string().optional().nullable(),
  photoName: z.string().optional().nullable(),

  // KYC Documents
  adhaar_path_url: z.string().optional().nullable(),
  adhaar_path_name: z.string().optional().nullable(),
  pan_path_url: z.string().optional().nullable(),
  pan_path_name: z.string().optional().nullable(),
  passport_path_url: z.string().optional().nullable(),
  passport_path_name: z.string().optional().nullable(),
  voter_id_path_url: z.string().optional().nullable(),
  voter_id_path_name: z.string().optional().nullable(),
  driving_licence_path_url: z.string().optional().nullable(),
  driving_licence_path_name: z.string().optional().nullable(),
  other_path_url: z.string().optional().nullable(),
  other_path_name: z.string().optional().nullable(),
  discharge_summary_path_url: z.string().optional().nullable(),
  discharge_summary_path_name: z.string().optional().nullable(),
  final_bill_path_url: z.string().optional().nullable(),
  final_bill_path_name: z.string().optional().nullable(),
  pharmacy_bill_path_url: z.string().optional().nullable(),
  pharmacy_bill_path_name: z.string().optional().nullable(),
  implant_bill_stickers_path_url: z.string().optional().nullable(),
  implant_bill_stickers_path_name: z.string().optional().nullable(),
  lab_bill_path_url: z.string().optional().nullable(),
  lab_bill_path_name: z.string().optional().nullable(),
  ot_anesthesia_notes_path_url: z.string().optional().nullable(),
  ot_anesthesia_notes_path_name: z.string().optional().nullable(),

  // Admission Details
  admission_id: z.string().optional().nullable(),
  relationship_policyholder: z.string().optional().nullable(),
  policy_number: z.string().optional().nullable(),
  insured_card_number: z.string().optional().nullable(),
  company_id: z.string().optional().nullable(),
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
  
  // Hospital & TPA
  tpa_id: z.coerce.number().optional().nullable(),
  hospital_id: z.string().optional().nullable(),
  treat_doc_name: z.string().optional().nullable(),
  treat_doc_number: z.string().optional().nullable(),
  treat_doc_qualification: z.string().optional().nullable(),
  treat_doc_reg_no: z.string().optional().nullable(),
  doctor_id: z.coerce.number().optional().nullable(),

  // C. Clinical Information
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

  // D. Accident / Medico-Legal
  isInjury: z.string().optional().nullable(),
  injuryCause: z.string().optional().nullable(),
  isRta: z.string().optional().nullable(),
  injuryDate: z.string().optional().nullable(),
  isReportedToPolice: z.string().optional().nullable(),
  firNumber: z.string().optional().nullable(),
  isAlcoholSuspected: z.string().optional().nullable(),
  isToxicologyConducted: z.string().optional().nullable(),

  // E. Maternity
  isMaternity: z.string().optional().nullable(),
  g: z.coerce.number().optional().nullable(),
  p: z.coerce.number().optional().nullable(),
  l: z.coerce.number().optional().nullable(),
  a: z.coerce.number().optional().nullable(),
  expectedDeliveryDate: z.string().optional().nullable(),

  // F. Admission & Cost Estimate
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
  totalExpectedCost: z.coerce.number().optional().nullable(),

  // H. Declarations & Attachments
  chiefComplaints: z.string().optional().nullable(),
});

const patientAddFormSchema = basePatientObjectSchema;

const patientUpdateFormSchema = basePatientObjectSchema.extend({
  id: z.string(), // Patient ID
  admission_db_id: z.coerce.number().optional().nullable(), // Admission ID from DB
});


export type Doctor = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  qualification?: string | null;
  reg_no?: string | null;
}

export async function getDoctors(): Promise<Doctor[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query('SELECT * FROM doctors');
    return result.recordset as Doctor[];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    const dbError = error as Error;
    throw new Error(`Error fetching doctors: ${dbError.message}`);
  }
}

export async function getPatients(hospitalId?: string | null): Promise<Patient[]> {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    
    let whereClause = '';
    if (hospitalId) {
      request.input('hospitalId', sql.NVarChar, hospitalId);
      whereClause = 'WHERE p.hospital_id = @hospitalId';
    }

    const result = await request.query(`
        SELECT p.id, p.first_name, p.last_name, p.photo, p.email_address, p.phone_number as phoneNumber, a.policy_number as policyNumber, co.name as companyName
        FROM patients p
        LEFT JOIN admissions a ON p.id = a.patient_id
        LEFT JOIN companies co ON a.insurance_company = co.id
        ${whereClause}
      `);
      
    return result.recordset.map(record => {
        let photoUrl = null;
        if (record.photo) {
            try {
                const parsedPhoto = JSON.parse(record.photo);
                photoUrl = parsedPhoto.url;
            } catch (e) {
                if (typeof record.photo === 'string' && record.photo.startsWith('http')) {
                    photoUrl = record.photo;
                }
            }
        }
        return {
            ...record,
            id: record.id.toString(),
            fullName: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
            photo: photoUrl
        }
    }) as Patient[];
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching patients: ${dbError.message}`);
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


export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('id', sql.Int, Number(id))
       .query(`
        SELECT 
          p.first_name,
          p.last_name,
          p.email_address,
          p.phone_number,
          p.alternative_number,
          p.gender,
          p.age,
          p.birth_date,
          p.address,
          p.occupation,
          p.employee_id,
          p.abha_id,
          p.health_id,
          p.photo,
          p.adhaar_path,
          p.pan_path,
          p.passport_path,
          p.voter_id_path,
          p.driving_licence_path,
          p.other_path,
          p.discharge_summary,
          p.final_bill,
          p.pharmacy_bill,
          p.implant_bill,
          p.lab_bill,
          p.ot_notes,
          a.*,
          p.id as patient_db_id,
          a.id as admission_db_id,
          c.name as companyName,
          t.name as tpaName,
          t.email as tpaEmail
        FROM patients p
        LEFT JOIN admissions a ON p.id = a.patient_id
        LEFT JOIN companies c ON a.insurance_company = c.id
        LEFT JOIN tpas t ON a.tpa_id = t.id
        WHERE p.id = @id
      `);
      
    if (result.recordset.length === 0) {
      return null;
    }
    const record = result.recordset[0];
    
    const patientData: Patient = {
        id: record.patient_db_id.toString(),
        admission_db_id: record.admission_db_id,
        fullName: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
        firstName: record.first_name,
        lastName: record.last_name,
        email_address: record.email_address,
        phoneNumber: record.phone_number,
        alternative_number: record.alternative_number,
        gender: record.gender,
        age: record.age,
        dateOfBirth: record.birth_date,
        address: record.address,
        occupation: record.occupation,
        employee_id: record.employee_id,
        abha_id: record.abha_id,
        health_id: record.health_id,
        photo: getDocumentData(record.photo),
        adhaar_path: getDocumentData(record.adhaar_path),
        pan_path: getDocumentData(record.pan_path),
        passport_path: getDocumentData(record.passport_path),
        voter_id_path: getDocumentData(record.voter_id_path),
        driving_licence_path: getDocumentData(record.driving_licence_path),
        other_path: getDocumentData(record.other_path),
        discharge_summary_path: getDocumentData(record.discharge_summary),
        final_bill_path: getDocumentData(record.final_bill),
        pharmacy_bill_path: getDocumentData(record.pharmacy_bill),
        implant_bill_stickers_path: getDocumentData(record.implant_bill),
        lab_bill_path: getDocumentData(record.lab_bill),
        ot_anesthesia_notes_path: getDocumentData(record.ot_notes),
        admission_id: record.admission_id,
        relationship_policyholder: record.relationship_policyholder,
        policyNumber: record.policy_number,
        memberId: record.insured_card_number,
        companyId: record.insurance_company,
        policyStartDate: record.policy_start_date,
        policyEndDate: record.policy_end_date,
        sumInsured: record.sum_insured,
        sumUtilized: record.sum_utilized,
        totalSum: record.total_sum,
        corporate_policy_number: record.corporate_policy_number,
        other_policy_name: record.other_policy_name,
        family_doctor_name: record.family_doctor_name,
        family_doctor_phone: record.family_doctor_phone,
        payer_email: record.payer_email,
        payer_phone: record.payer_phone,
        tpa_id: record.tpa_id,
        doctor_id: record.doctor_id,
        treat_doc_name: record.treat_doc_name,
        treat_doc_number: record.treat_doc_number,
        treat_doc_qualification: record.treat_doc_qualification,
        treat_doc_reg_no: record.treat_doc_reg_no,
        natureOfIllness: record.natureOfIllness,
        clinicalFindings: record.clinicalFindings,
        ailmentDuration: record.ailmentDuration,
        firstConsultationDate: record.firstConsultationDate,
        pastHistory: record.pastHistory,
        provisionalDiagnosis: record.provisionalDiagnosis,
        icd10Codes: record.icd10Codes,
        treatmentMedical: record.treatmentMedical,
        treatmentSurgical: record.treatmentSurgical,
        treatmentIntensiveCare: record.treatmentIntensiveCare,
        treatmentInvestigation: record.treatmentInvestigation,
        treatmentNonAllopathic: record.treatmentNonAllopathic,
        investigationDetails: record.investigationDetails,
        drugRoute: record.drugRoute,
        procedureName: record.procedureName,
        icd10PcsCodes: record.icd10PcsCodes,
        otherTreatments: record.otherTreatments,
        isInjury: record.isInjury,
        injuryCause: record.injuryCause,
        isRta: record.isRta,
        injuryDate: record.injuryDate,
        isReportedToPolice: record.isReportedToPolice,
        firNumber: record.firNumber,
        isAlcoholSuspected: record.isAlcoholSuspected,
        isToxicologyConducted: record.isToxicologyConducted,
        isMaternity: record.isMaternity,
        g: record.g,
        p: record.p,
        l: record.l,
        a: record.a,
        expectedDeliveryDate: record.expectedDeliveryDate,
        admissionDate: record.admissionDate,
        admissionTime: record.admissionTime,
        admissionType: record.admissionType,
        expectedStay: record.expectedStay,
        expectedIcuStay: record.expectedIcuStay,
        roomCategory: record.roomCategory,
        roomNursingDietCost: record.roomNursingDietCost,
        investigationCost: record.investigationCost,
        icuCost: record.icuCost,
        otCost: record.otCost,
        professionalFees: record.professionalFees,
        medicineCost: record.medicineCost,
        otherHospitalExpenses: record.otherHospitalExpenses,
        packageCharges: record.packageCharges,
        totalExpectedCost: record.totalExpectedCost,
        companyName: record.companyName,
        tpaName: record.tpaName,
        tpaEmail: record.tpaEmail,
    };

    const dateFields: (keyof Patient)[] = ['dateOfBirth', 'policyStartDate', 'policyEndDate', 'firstConsultationDate', 'injuryDate', 'expectedDeliveryDate', 'admissionDate'];
    for (const field of dateFields) {
        if (patientData[field]) {
            // @ts-ignore
            patientData[field] = new Date(patientData[field]).toISOString().split('T')[0];
        }
    }
    
    return patientData;
  } catch (error) {
    console.error(`Error fetching patient with id ${id}:`, error);
    throw new Error("Failed to fetch patient from database.");
  }
}

export async function getNewPatientPageData() {
    try {
        const pool = await getDbPool();
        const [companiesResult, tpasResult, doctorsResult] = await Promise.all([
            pool.request().query('SELECT id, name FROM companies'),
            pool.request().query('SELECT id, name FROM tpas'),
            pool.request().query('SELECT * FROM doctors'),
        ]);

        type CompaniesType = Pick<Company, 'id' | 'name'>[];
        type TpasType = Pick<TPA, 'id' | 'name'>[];
        type DoctorsType = Doctor[];

        return {
            companies: companiesResult.recordset as CompaniesType,
            tpas: tpasResult.recordset.map(r => ({ ...r, id: r.id.toString() })) as TpasType,
            doctors: doctorsResult.recordset as DoctorsType,
        };
    } catch (error) {
        console.error("Error fetching data for new patient page:", error);
        throw new Error("Failed to fetch data for new patient page.");
    }
}

export async function getPatientEditPageData(patientId: string) {
    try {
        const pool = await getDbPool();
        const [patientData, companiesResult, tpasResult, doctorsResult, complaintsResult] = await Promise.all([
            getPatientById(patientId),
            pool.request().query('SELECT id, name FROM companies'),
            pool.request().query('SELECT id, name FROM tpas'),
            pool.request().query('SELECT * FROM doctors'),
            pool.request().input('patient_id', sql.Int, Number(patientId)).query('SELECT * FROM chief_complaints WHERE patient_id = @patient_id')
        ]);

        if (!patientData) {
            return null;
        }

        const complaints = complaintsResult.recordset.map(c => ({
            id: c.id,
            name: c.complaint_name,
            selected: true,
            durationValue: c.duration_value,
            durationUnit: c.duration_unit
        }));

        type CompaniesType = Pick<Company, 'id' | 'name'>[];
        type TpasType = Pick<TPA, 'id' | 'name'>[];
        type DoctorsType = Doctor[];

        return {
            patient: patientData,
            companies: companiesResult.recordset as CompaniesType,
            tpas: tpasResult.recordset.map(r => ({ ...r, id: r.id.toString() })) as TpasType,
            doctors: doctorsResult.recordset as DoctorsType,
            complaints
        };
    } catch (error) {
        console.error("Error fetching data for patient edit page:", error);
        throw new Error("Failed to fetch data for patient edit page.");
    }
}

export async function getPatientsForPreAuth(hospitalId: string): Promise<{ id: string; fullName: string; admission_id: string; }[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('hospitalId', sql.NVarChar, hospitalId)
      .query(`
        SELECT p.id, p.first_name + ' ' + p.last_name as fullName, a.admission_id
        FROM patients p
        LEFT JOIN admissions a ON p.id = a.patient_id
        WHERE p.hospital_id = @hospitalId
      `);
    return result.recordset.map(r => ({...r, id: r.id.toString()}));
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching patients for pre-auth: ${dbError.message}`);
  }
}

export async function getPatientWithDetailsForForm(patientId: string): Promise<Patient | null> {
    if (!patientId) return null;
    return getPatientById(patientId);
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

const createDocumentJson = (url: string | undefined | null, name: string | undefined | null): string | null => {
    if (url && name) {
        return JSON.stringify({ url, name });
    }
    if (url) {
        return JSON.stringify({ url, name: 'file' });
    }
    return null;
};

async function handleSaveChiefComplaints(transaction: sql.Transaction, patientId: number, complaintsJson: string) {
    if (!complaintsJson) return;

    const complaints = JSON.parse(complaintsJson);
    if (!Array.isArray(complaints) || complaints.length === 0) return;
    
    const deleteRequest = new sql.Request(transaction);
    await deleteRequest
      .input('patient_id', sql.Int, patientId)
      .query('DELETE FROM chief_complaints WHERE patient_id = @patient_id');

    for (const complaint of complaints) {
        if(complaint.selected && complaint.name){
            const insertRequest = new sql.Request(transaction);
            await insertRequest
                .input('patient_id', sql.Int, patientId)
                .input('complaint_name', sql.NVarChar, complaint.name)
                .input('duration_value', sql.NVarChar, complaint.durationValue)
                .input('duration_unit', sql.NVarChar, complaint.durationUnit)
                .query(`
                    INSERT INTO chief_complaints (patient_id, complaint_name, duration_value, duration_unit)
                    VALUES (@patient_id, @complaint_name, @duration_value, @duration_unit)
                `);
        }
    }
}


export async function handleAddPatient(prevState: { message: string, type?: string }, formData: FormData) {
  const formObject = Object.fromEntries(formData.entries());
  const validatedFields = patientAddFormSchema.safeParse(formObject);
  
  if (!validatedFields.success) {
        const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
        return { message: `Invalid data: ${errorMessages}`, type: 'error' };
    }
    
  const data = validatedFields.data;
  let transaction;
  
  try {
    const pool = await getDbPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const photoJson = createDocumentJson(data.photoUrl, data.photoName);
    const adhaarJson = createDocumentJson(data.adhaar_path_url, data.adhaar_path_name);
    const panJson = createDocumentJson(data.pan_path_url, data.pan_path_name);
    const passportJson = createDocumentJson(data.passport_path_url, data.passport_path_name);
    const voterIdJson = createDocumentJson(data.voter_id_path_url, data.voter_id_path_name);
    const drivingLicenceJson = createDocumentJson(data.driving_licence_path_url, data.driving_licence_path_name);
    const otherJson = createDocumentJson(data.other_path_url, data.other_path_name);
    const dischargeSummaryJson = createDocumentJson(data.discharge_summary_path_url, data.discharge_summary_path_name);
    const finalBillJson = createDocumentJson(data.final_bill_path_url, data.final_bill_path_name);
    const pharmacyBillJson = createDocumentJson(data.pharmacy_bill_path_url, data.pharmacy_bill_path_name);
    const implantBillJson = createDocumentJson(data.implant_bill_stickers_path_url, data.implant_bill_stickers_path_name);
    const labBillJson = createDocumentJson(data.lab_bill_path_url, data.lab_bill_path_name);
    const otNotesJson = createDocumentJson(data.ot_anesthesia_notes_path_url, data.ot_anesthesia_notes_path_name);
    
    // Insert into patients table
    const patientRequest = new sql.Request(transaction);
    const patientResult = await patientRequest
      .input('first_name', sql.NVarChar, data.firstName)
      .input('last_name', sql.NVarChar, data.lastName)
      .input('email_address', sql.NVarChar, data.email_address)
      .input('phone_number', sql.NVarChar, data.phone_number || null)
      .input('alternative_number', sql.NVarChar, data.alternative_number || null)
      .input('gender', sql.NVarChar, data.gender)
      .input('birth_date', data.birth_date ? sql.Date : sql.Date, data.birth_date ? new Date(data.birth_date) : null)
      .input('address', sql.NVarChar, data.address)
      .input('occupation', sql.NVarChar, data.occupation || null)
      .input('employee_id', sql.NVarChar, data.employee_id || null)
      .input('abha_id', sql.NVarChar, data.abha_id || null)
      .input('health_id', sql.NVarChar, data.health_id || null)
      .input('hospital_id', sql.NVarChar, data.hospital_id || null)
      .input('photo', sql.NVarChar, photoJson)
      .input('adhaar_path', sql.NVarChar, adhaarJson)
      .input('pan_path', sql.NVarChar, panJson)
      .input('passport_path', sql.NVarChar, passportJson)
      .input('voter_id_path', sql.NVarChar, voterIdJson)
      .input('driving_licence_path', sql.NVarChar, drivingLicenceJson)
      .input('other_path', sql.NVarChar, otherJson)
      .input('discharge_summary', sql.NVarChar, dischargeSummaryJson)
      .input('final_bill', sql.NVarChar, finalBillJson)
      .input('pharmacy_bill', sql.NVarChar, pharmacyBillJson)
      .input('implant_bill', sql.NVarChar, implantBillJson)
      .input('lab_bill', sql.NVarChar, labBillJson)
      .input('ot_notes', sql.NVarChar, otNotesJson)
      .query(`
        INSERT INTO patients (
          first_name, last_name, email_address, phone_number, alternative_number, gender, birth_date, address, occupation, 
          employee_id, abha_id, health_id, hospital_id, photo, adhaar_path, pan_path, passport_path, voter_id_path, 
          driving_licence_path, other_path, discharge_summary, final_bill, pharmacy_bill, implant_bill, lab_bill, ot_notes
        )
        OUTPUT INSERTED.id
        VALUES (
          @first_name, @last_name, @email_address, @phone_number, @alternative_number, @gender, @birth_date, @address, @occupation,
          @employee_id, @abha_id, @health_id, @hospital_id, @photo, @adhaar_path, @pan_path, @passport_path, @voter_id_path, 
          @driving_licence_path, @other_path, @discharge_summary, @final_bill, @pharmacy_bill, @implant_bill, @lab_bill, @ot_notes
        )
      `);
    
    const patientId = patientResult.recordset[0]?.id;
    
    if (!patientId || typeof patientId !== 'number') {
        throw new Error("Failed to create patient record or retrieve ID.");
    }
      
    // Insert into admissions table
    const admissionRequest = new sql.Request(transaction);
    await admissionRequest
      .input('patient_id', sql.Int, patientId)
      .input('doctor_id', sql.Int, data.doctor_id)
      .input('admission_id', sql.NVarChar, data.admission_id)
      .input('relationship_policyholder', sql.NVarChar, data.relationship_policyholder)
      .input('policy_number', sql.NVarChar, data.policy_number)
      .input('insured_card_number', sql.NVarChar, data.insured_card_number)
      .input('insurance_company', sql.NVarChar, data.company_id)
      .input('policy_start_date', sql.Date, data.policy_start_date ? new Date(data.policy_start_date) : null)
      .input('policy_end_date', sql.Date, data.policy_end_date ? new Date(data.policy_end_date) : null)
      .input('sum_insured', sql.Decimal(18, 2), data.sumInsured)
      .input('sum_utilized', sql.Decimal(18, 2), data.sumUtilized)
      .input('total_sum', sql.Decimal(18, 2), data.totalSum)
      .input('corporate_policy_number', sql.NVarChar, data.corporate_policy_number)
      .input('other_policy_name', sql.NVarChar, data.other_policy_name)
      .input('family_doctor_name', sql.NVarChar, data.family_doctor_name)
      .input('family_doctor_phone', sql.NVarChar, data.family_doctor_phone)
      .input('payer_email', sql.NVarChar, data.payer_email)
      .input('payer_phone', sql.NVarChar, data.payer_phone)
      .input('tpa_id', sql.Int, data.tpa_id)
      .input('hospital_id', sql.NVarChar, data.hospital_id)
      .input('treat_doc_name', sql.NVarChar, data.treat_doc_name)
      .input('treat_doc_number', sql.NVarChar, data.treat_doc_number)
      .input('treat_doc_qualification', sql.NVarChar, data.treat_doc_qualification)
      .input('treat_doc_reg_no', sql.NVarChar, data.treat_doc_reg_no)
      .input('natureOfIllness', sql.NVarChar, data.natureOfIllness)
      .input('clinicalFindings', sql.NVarChar, data.clinicalFindings)
      .input('ailmentDuration', sql.Int, data.ailmentDuration)
      .input('firstConsultationDate', sql.Date, data.firstConsultationDate ? new Date(data.firstConsultationDate) : null)
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
      .input('injuryDate', sql.Date, data.injuryDate ? new Date(data.injuryDate) : null)
      .input('isReportedToPolice', sql.Bit, data.isReportedToPolice === 'on' ? 1 : 0)
      .input('firNumber', sql.NVarChar, data.firNumber)
      .input('isAlcoholSuspected', sql.Bit, data.isAlcoholSuspected === 'on' ? 1 : 0)
      .input('isToxicologyConducted', sql.Bit, data.isToxicologyConducted === 'on' ? 1 : 0)
      .input('isMaternity', sql.Bit, data.isMaternity === 'on' ? 1 : 0)
      .input('g', sql.Int, data.g)
      .input('p', sql.Int, data.p)
      .input('l', sql.Int, data.l)
      .input('a', sql.Int, data.a)
      .input('expectedDeliveryDate', sql.Date, data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null)
      .input('admissionDate', sql.Date, data.admissionDate ? new Date(data.admissionDate) : null)
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
      .input('totalExpectedCost', sql.Decimal(18, 2), data.totalExpectedCost)
      .input('status', sql.NVarChar, 'Active')
      .query(`
        INSERT INTO admissions (
          patient_id, doctor_id, admission_id, relationship_policyholder, policy_number, insured_card_number, insurance_company, policy_start_date, policy_end_date, 
          sum_insured, sum_utilized, total_sum, corporate_policy_number, other_policy_name, family_doctor_name, family_doctor_phone, payer_email, payer_phone, tpa_id, hospital_id,
          treat_doc_name, treat_doc_number, treat_doc_qualification, treat_doc_reg_no, natureOfIllness, clinicalFindings, ailmentDuration, firstConsultationDate,
          pastHistory, provisionalDiagnosis, icd10Codes, treatmentMedical, treatmentSurgical, treatmentIntensiveCare, treatmentInvestigation, treatmentNonAllopathic,
          investigationDetails, drugRoute, procedureName, icd10PcsCodes, otherTreatments, isInjury, injuryCause, isRta, injuryDate, isReportedToPolice, firNumber,
          isAlcoholSuspected, isToxicologyConducted, isMaternity, g, p, l, a, expectedDeliveryDate, admissionDate, admissionTime, admissionType, expectedStay,
          expectedIcuStay, roomCategory, roomNursingDietCost, investigationCost, icuCost, otCost, professionalFees, medicineCost, otherHospitalExpenses, packageCharges, totalExpectedCost, status
        ) VALUES (
          @patient_id, @doctor_id, @admission_id, @relationship_policyholder, @policy_number, @insured_card_number, @insurance_company, @policy_start_date, @policy_end_date, 
          @sum_insured, @sum_utilized, @total_sum, @corporate_policy_number, @other_policy_name, @family_doctor_name, @family_doctor_phone, @payer_email, @payer_phone, @tpa_id, @hospital_id,
          @treat_doc_name, @treat_doc_number, @treat_doc_qualification, @treat_doc_reg_no, @natureOfIllness, @clinicalFindings, @ailmentDuration, @firstConsultationDate,
          @pastHistory, @provisionalDiagnosis, @icd10Codes, @treatmentMedical, @treatmentSurgical, @treatmentIntensiveCare, @treatmentInvestigation, @treatmentNonAllopathic,
          @investigationDetails, @drugRoute, @procedureName, @icd10PcsCodes, @otherTreatments, @isInjury, @injuryCause, @isRta, @injuryDate, @isReportedToPolice, @firNumber,
          @isAlcoholSuspected, @isToxicologyConducted, @isMaternity, @g, @p, @l, @a, @expectedDeliveryDate, @admissionDate, @admissionTime, @admissionType, @expectedStay,
          @expectedIcuStay, @roomCategory, @roomNursingDietCost, @investigationCost, @icuCost, @otCost, @professionalFees, @medicineCost, @otherHospitalExpenses, @packageCharges, @totalExpectedCost, @status
        )
      `);
      
    await handleSaveChiefComplaints(transaction, patientId, data.chiefComplaints);

    await transaction.commit();

  } catch (error) {
    if(transaction) await transaction.rollback();
    console.error('Error adding patient:', error);
    const dbError = error as { message?: string };
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function handleUpdatePatient(prevState: { message: string, type?: string }, formData: FormData) {
    const formObject = Object.fromEntries(formData.entries());
    const validatedFields = patientUpdateFormSchema.safeParse(formObject);

    if (!validatedFields.success) {
        const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
        return { message: `Invalid data: ${errorMessages}`, type: 'error' };
    }

    const { data } = validatedFields;
    const { id: patientId, admission_db_id } = data;
    let transaction;

    try {
        const pool = await getDbPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const photoJson = createDocumentJson(data.photoUrl, data.photoName);
        const adhaarJson = createDocumentJson(data.adhaar_path_url, data.adhaar_path_name);
        const panJson = createDocumentJson(data.pan_path_url, data.pan_path_name);
        const passportJson = createDocumentJson(data.passport_path_url, data.passport_path_name);
        const voterIdJson = createDocumentJson(data.voter_id_path_url, data.voter_id_path_name);
        const drivingLicenceJson = createDocumentJson(data.driving_licence_path_url, data.driving_licence_path_name);
        const otherJson = createDocumentJson(data.other_path_url, data.other_path_name);
        const dischargeSummaryJson = createDocumentJson(data.discharge_summary_path_url, data.discharge_summary_path_name);
        const finalBillJson = createDocumentJson(data.final_bill_path_url, data.final_bill_path_name);
        const pharmacyBillJson = createDocumentJson(data.pharmacy_bill_path_url, data.pharmacy_bill_path_name);
        const implantBillJson = createDocumentJson(data.implant_bill_stickers_path_url, data.implant_bill_stickers_path_name);
        const labBillJson = createDocumentJson(data.lab_bill_path_url, data.lab_bill_path_name);
        const otNotesJson = createDocumentJson(data.ot_anesthesia_notes_path_url, data.ot_anesthesia_notes_path_name);

        const patientRequest = new sql.Request(transaction);
        await patientRequest
            .input('id', sql.Int, Number(patientId))
            .input('first_name', sql.NVarChar, data.firstName)
            .input('last_name', sql.NVarChar, data.lastName)
            .input('email_address', sql.NVarChar, data.email_address)
            .input('phone_number', sql.NVarChar, data.phone_number || null)
            .input('alternative_number', sql.NVarChar, data.alternative_number || null)
            .input('gender', sql.NVarChar, data.gender)
            .input('birth_date', data.birth_date ? sql.Date : sql.Date, data.birth_date ? new Date(data.birth_date) : null)
            .input('address', sql.NVarChar, data.address)
            .input('occupation', sql.NVarChar, data.occupation || null)
            .input('employee_id', sql.NVarChar, data.employee_id || null)
            .input('abha_id', sql.NVarChar, data.abha_id || null)
            .input('health_id', sql.NVarChar, data.health_id || null)
            .input('hospital_id', sql.NVarChar, data.hospital_id || null)
            .input('photo', sql.NVarChar, photoJson)
            .input('adhaar_path', sql.NVarChar, adhaarJson)
            .input('pan_path', sql.NVarChar, panJson)
            .input('passport_path', sql.NVarChar, passportJson)
            .input('voter_id_path', sql.NVarChar, voterIdJson)
            .input('driving_licence_path', sql.NVarChar, drivingLicenceJson)
            .input('other_path', sql.NVarChar, otherJson)
            .input('discharge_summary', sql.NVarChar, dischargeSummaryJson)
            .input('final_bill', sql.NVarChar, finalBillJson)
            .input('pharmacy_bill', sql.NVarChar, pharmacyBillJson)
            .input('implant_bill', sql.NVarChar, implantBillJson)
            .input('lab_bill', sql.NVarChar, labBillJson)
            .input('ot_notes', sql.NVarChar, otNotesJson)
            .query(`
                UPDATE patients 
                SET 
                first_name = @first_name, last_name = @last_name, email_address = @email_address, phone_number = @phone_number, alternative_number = @alternative_number, 
                gender = @gender, birth_date = @birth_date, address = @address, occupation = @occupation,
                employee_id = @employee_id, abha_id = @abha_id, health_id = @health_id, hospital_id = @hospital_id,
                photo = @photo, adhaar_path = @adhaar_path, pan_path = @pan_path, passport_path = @passport_path, 
                voter_id_path = @voter_id_path, driving_licence_path = @driving_licence_path, other_path = @other_path,
                discharge_summary = @discharge_summary, final_bill = @final_bill, pharmacy_bill = @pharmacy_bill,
                implant_bill = @implant_bill, lab_bill = @lab_bill, ot_notes = @ot_notes,
                updated_at = GETDATE()
                WHERE id = @id
            `);

        // Update admissions table
        if (admission_db_id) {
          const admissionRequest = new sql.Request(transaction);
          await admissionRequest
              .input('id', sql.Int, admission_db_id)
              .input('doctor_id', sql.Int, data.doctor_id)
              .input('admission_id', sql.NVarChar, data.admission_id)
              .input('status', sql.NVarChar, 'Active')
              // ... add all other fields for admissions table update
              .query(`
                UPDATE admissions 
                SET 
                  doctor_id = @doctor_id,
                  admission_id = @admission_id,
                  status = @status,
                  -- etc for all other fields
                  updated_at = GETDATE()
                WHERE id = @id
              `);
        }

        await handleSaveChiefComplaints(transaction, Number(patientId), data.chiefComplaints);

        await transaction.commit();

    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error('Error updating patient:', error);
        const dbError = error as { message?: string };
        return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: 'error' };
    }
    
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${patientId}/edit`);
    redirect('/dashboard/patients');
}

export async function handleDeletePatient(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
     if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }
    let transaction;

    try {
        const pool = await getDbPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        await new sql.Request(transaction)
          .input('patient_id', sql.Int, Number(id))
          .query('DELETE FROM chief_complaints WHERE patient_id = @patient_id');

        await new sql.Request(transaction)
          .input('patient_id', sql.Int, Number(id))
          .query('DELETE FROM admissions WHERE patient_id = @patient_id');
        
        const result = await new sql.Request(transaction)
            .input('id', sql.Int, Number(id))
            .query('DELETE FROM patients WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return { message: "Patient not found.", type: 'error' };
        }
        await transaction.commit();

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/patients');
    return { message: "Patient deleted successfully.", type: 'success' };
}

export async function searchIctCodes(query: string): Promise<{ shortcode: string; description: string; }[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('query', sql.NVarChar, `%${query}%`)
      .query(`
        SELECT TOP 20 shortcode, description 
        FROM ict_code 
        WHERE shortcode LIKE @query OR description LIKE @query
      `);
    return result.recordset;
  } catch (error) {
    console.error('Error searching ICT codes:', error);
    return [];
  }
}

export async function getChiefComplaints(patientId: number) {
    if(!patientId) return [];
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .input('patient_id', sql.Int, patientId)
            .query('SELECT * FROM chief_complaints WHERE patient_id = @patient_id');
        
        return result.recordset.map(c => ({
            id: c.id,
            name: c.complaint_name,
            selected: true,
            durationValue: c.duration_value,
            durationUnit: c.duration_unit
        }));

    } catch (error) {
        console.error('Error fetching chief complaints:', error);
        return [];
    }
}

export async function getClaimsForPatientTimeline(patientId: string): Promise<Claim[]> {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .input('patientId', sql.Int, Number(patientId))
            .query(`
                SELECT *
                FROM claims 
                WHERE Patient_id = @patientId
                ORDER BY updated_at ASC
            `);

        return result.recordset as Claim[];
    } catch (error) {
        console.error("Error fetching claims for timeline:", error);
        throw new Error("Failed to fetch claims from database for the timeline.");
    }
}
    

    

