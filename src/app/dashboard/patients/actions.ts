

"use server";

import pool, { sql, poolConnect } from "@/lib/db";
import { Patient, Company, TPA } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { z } from 'zod';


const phoneRegex = new RegExp(/^\d{10}$/);

const basePatientFormSchema = z.object({
  // Patient Details
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  email_address: z.string().email("Invalid email address.").optional().nullable(),
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
  
  photoUrl: z.string().optional().nullable(),
  photoName: z.string().optional().nullable(),


  // KYC Documents - now expect pairs of url/name
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

  // Insurance Details
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

  // Medical History (covered by chiefComplaints)
  diabetesSince: z.string().optional().nullable(),
  hypertensionSince: z.string().optional().nullable(),
  heartDiseaseSince: z.string().optional().nullable(),
  hyperlipidemiaSince: z.string().optional().nullable(),
  osteoarthritisSince: z.string().optional().nullable(),
  asthmaCopdSince: z.string().optional().nullable(),
  cancerSince: z.string().optional().nullable(),
  alcoholDrugAbuseSince: z.string().optional().nullable(),
  hivSince: z.string().optional().nullable(),
  otherChronicAilment: z.string().optional().nullable(),

  // H. Declarations & Attachments
  patientDeclarationName: z.string().optional().nullable(),
  patientDeclarationContact: z.string().optional().nullable(),
  patientDeclarationEmail: z.string().email().optional().nullable(),
  patientDeclarationDate: z.string().optional().nullable(),
  patientDeclarationTime: z.string().optional().nullable(),
  hospitalDeclarationDoctorName: z.string().optional().nullable(),
  hospitalDeclarationDate: z.string().optional().nullable(),
  hospitalDeclarationTime: z.string().optional().nullable(),
  attachments: z.array(z.string()).optional().nullable(),
  chiefComplaints: z.string().optional().nullable(),
});

const addPatientFormSchema = basePatientFormSchema;
const updatePatientFormSchema = basePatientFormSchema.extend({
  id: z.string(), // Patient ID
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
    await poolConnect;
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
    await poolConnect;
    const request = pool.request();
    
    let whereClause = '';
    if (hospitalId) {
      request.input('hospitalId', sql.NVarChar, hospitalId);
      whereClause = 'WHERE p.hospital_id = @hospitalId';
    }

    const result = await request.query(`
        SELECT p.id, p.first_name, p.last_name, p.photo, p.email_address, p.phone_number as phoneNumber, a.policy_number as policyNumber, c.name as companyName
        FROM patients p
        LEFT JOIN admissions a ON p.id = a.patient_id
        LEFT JOIN companies c ON a.insurance_company = c.id
        ${whereClause}
      `);
      
    return result.recordset.map(record => {
        let photoUrl = null;
        if (record.photo) {
            try {
                const parsedPhoto = JSON.parse(record.photo);
                photoUrl = parsedPhoto.url;
            } catch (e) {
                 // Fallback for non-JSON string
                if (typeof record.photo === 'string' && record.photo.startsWith('http')) {
                    photoUrl = record.photo;
                }
            }
        }
        return {
            ...record,
            id: record.id.toString(), // Ensure id is a string
            fullName: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
            photo: photoUrl // only send url to client for table view
        }
    }) as Patient[];
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching patients: ${dbError.message}`);
  }
}

// Helper to safely parse a JSON string
const getDocumentData = (jsonString: string | null | undefined): { url: string; name: string } | null => {
    if (!jsonString) return null;
    try {
        const parsed = JSON.parse(jsonString);
        if (typeof parsed === 'object' && parsed !== null && 'url' in parsed) {
            return { url: parsed.url, name: parsed.name || 'View Document' };
        }
    } catch (e) {
        // Fallback for legacy plain URL strings
        if (typeof jsonString === 'string' && jsonString.startsWith('http')) {
            return { url: jsonString, name: 'View Document' };
        }
    }
    return null;
};


export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, Number(id))
       .query(`
        SELECT 
          p.id,
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
          a.id as admission_db_id,
          a.patient_id,
          a.admission_id,
          a.relationship_policyholder,
          a.policy_number,
          a.insured_card_number,
          a.insurance_company,
          a.policy_start_date,
          a.policy_end_date,
          a.sum_insured,
          a.sum_utilized,
          a.total_sum,
          a.corporate_policy_number,
          a.other_policy_name,
          a.family_doctor_name,
          a.family_doctor_phone,
          a.payer_email,
          a.payer_phone,
          a.tpa_id,
          a.treat_doc_name,
          a.treat_doc_number,
          a.treat_doc_qualification,
          a.treat_doc_reg_no,
          a.natureOfIllness,
          a.clinicalFindings,
          a.ailmentDuration,
          a.firstConsultationDate,
          a.pastHistory,
          a.provisionalDiagnosis,
          a.icd10Codes,
          a.treatmentMedical,
          a.treatmentSurgical,
          a.treatmentIntensiveCare,
          a.treatmentInvestigation,
          a.treatmentNonAllopathic,
          a.investigationDetails,
          a.drugRoute,
          a.procedureName,
          a.icd10PcsCodes,
          a.otherTreatments,
          a.isInjury,
          a.injuryCause,
          a.isRta,
          a.injuryDate,
          a.isReportedToPolice,
          a.firNumber,
          a.isAlcoholSuspected,
          a.isToxicologyConducted,
          a.isMaternity,
          a.g,
          a.p,
          a.l,
          a.a,
          a.expectedDeliveryDate,
          a.admissionDate,
          a.admissionTime,
          a.admissionType,
          a.expectedStay,
          a.expectedIcuStay,
          a.roomCategory,
          a.roomNursingDietCost,
          a.investigationCost,
          a.icuCost,
          a.otCost,
          a.professionalFees,
          a.medicineCost,
          a.otherHospitalExpenses,
          a.packageCharges,
          a.totalExpectedCost,
          a.diabetesSince,
          a.hypertensionSince,
          a.heartDiseaseSince,
          a.hyperlipidemiaSince,
          a.osteoarthritisSince,
          a.asthmaCopdSince,
          a.cancerSince,
          a.alcoholDrugAbuseSince,
          a.hivSince,
          a.otherChronicAilment,
          a.patientDeclarationName,
          a.patientDeclarationContact,
          a.patientDeclarationEmail,
          a.patientDeclarationDate,
          a.patientDeclarationTime,
          a.hospitalDeclarationDoctorName,
          a.hospitalDeclarationDate,
          a.hospitalDeclarationTime,
          a.attachments,
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
        id: record.id.toString(),
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
        diabetesSince: record.diabetesSince,
        hypertensionSince: record.hypertensionSince,
        heartDiseaseSince: record.heartDiseaseSince,
        hyperlipidemiaSince: record.hyperlipidemiaSince,
        osteoarthritisSince: record.osteoarthritisSince,
        asthmaCopdSince: record.asthmaCopdSince,
        cancerSince: record.cancerSince,
        alcoholDrugAbuseSince: record.alcoholDrugAbuseSince,
        hivSince: record.hivSince,
        otherChronicAilment: record.otherChronicAilment,
        patientDeclarationName: record.patientDeclarationName,
        patientDeclarationContact: record.patientDeclarationContact,
        patientDeclarationEmail: record.patientDeclarationEmail,
        patientDeclarationDate: record.patientDeclarationDate,
        patientDeclarationTime: record.patientDeclarationTime,
        hospitalDeclarationDoctorName: record.hospitalDeclarationDoctorName,
        hospitalDeclarationDate: record.hospitalDeclarationDate,
        hospitalDeclarationTime: record.hospitalDeclarationTime,
        attachments: record.attachments ? record.attachments.split(',') : [],
        companyName: record.companyName,
        tpaName: record.tpaName,
        tpaEmail: record.tpaEmail,
    };


    const dateFields: (keyof Patient)[] = ['dateOfBirth', 'policyStartDate', 'policyEndDate', 'firstConsultationDate', 'injuryDate', 'expectedDeliveryDate', 'admissionDate', 'patientDeclarationDate', 'hospitalDeclarationDate'];
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
        await poolConnect;
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
        await poolConnect;
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
    await poolConnect;
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

export async function handleUploadPatientFile(formData: FormData): Promise<{ type: 'success', url: string, name: string } | { type: 'error', message: string }> {
    const file = formData.get("file") as File | null;
    
    if (!file || file.size === 0) {
        return { type: 'error', message: 'No file provided.' };
    }
    
    try {
        const getFileAsDataURL = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        };
        const dataUrl = await getFileAsDataURL(file);
        return { type: 'success', url: dataUrl, name: file.name };

    } catch (error) {
        console.error("File handling error:", error);
        return { type: 'error', message: (error as Error).message };
    }
}


// Helper to create a JSON string from a URL and name
const createDocumentJson = (url: string | undefined | null, name: string | undefined | null): string | null => {
    if (url && name) {
        return JSON.stringify({ url, name });
    }
    if (url) {
        return JSON.stringify({ url, name: 'file' });
    }
    return null;
};

// Helper function to build the object from FormData
const buildObjectFromFormData = (formData: FormData) => {
    const data: { [key: string]: any } = {};
    
    formData.forEach((value, key) => {
      if (!key.endsWith('-file')) { // exclude raw file inputs
        if (key === 'attachments') {
          if (!data[key]) {
            data[key] = [];
          }
          data[key].push(value);
        } else {
          data[key] = value === '' ? null : value;
        }
      }
    });

    // Ensure attachments is an array even if it's empty or has one item
    if (!data.attachments) {
        data.attachments = [];
    } else if (typeof data.attachments === 'string') {
        data.attachments = [data.attachments];
    }

    return data;
};

async function handleSaveChiefComplaints(transaction: sql.Transaction, patientId: number, complaintsJson: string) {
    if (!complaintsJson) return;

    const complaints = JSON.parse(complaintsJson);
    if (!Array.isArray(complaints) || complaints.length === 0) return;
    
    // Clear existing complaints for the patient
    const deleteRequest = new sql.Request(transaction);
    await deleteRequest
      .input('patient_id', sql.Int, patientId)
      .query('DELETE FROM chief_complaints WHERE patient_id = @patient_id');

    // Insert new complaints
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
  const formObject = buildObjectFromFormData(formData);
  const validatedFields = addPatientFormSchema.safeParse(formObject);
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { data } = validatedFields;
  let transaction;
  
  try {
    await poolConnect;
    const db = pool;
    transaction = new sql.Transaction(db);
    await transaction.begin();

    const photoJson = createDocumentJson(data.photoUrl, data.photoName);
    const adhaarJson = createDocumentJson(data.adhaar_path_url, data.adhaar_path_name);
    const panJson = createDocumentJson(data.pan_path_url, data.pan_path_name);
    const passportJson = createDocumentJson(data.passport_path_url, data.passport_path_name);
    const voterIdJson = createDocumentJson(data.voter_id_path_url, data.voter_id_path_name);
    const drivingLicenceJson = createDocumentJson(data.driving_licence_path_url, data.driving_licence_path_name);
    const otherJson = createDocumentJson(data.other_path_url, data.other_path_name);
    
    // Insert into patients table
    const patientRequest = new sql.Request(transaction);
    const patientResult = await patientRequest
      .input('first_name', sql.NVarChar, data.firstName)
      .input('last_name', sql.NVarChar, data.lastName)
      .input('email_address', sql.NVarChar, data.email_address)
      .input('phone_number', sql.NVarChar, data.phone_number || null)
      .input('alternative_number', sql.NVarChar, data.alternative_number || null)
      .input('gender', sql.NVarChar, data.gender)
      .input('age', sql.Int, data.age)
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
      .query(`
        INSERT INTO patients (first_name, last_name, email_address, phone_number, alternative_number, gender, age, birth_date, address, occupation, employee_id, abha_id, health_id, hospital_id, photo, adhaar_path, pan_path, passport_path, voter_id_path, driving_licence_path, other_path)
        OUTPUT INSERTED.id
        VALUES (@first_name, @last_name, @email_address, @phone_number, @alternative_number, @gender, @age, @birth_date, @address, @occupation, @employee_id, @abha_id, @health_id, @hospital_id, @photo, @adhaar_path, @pan_path, @passport_path, @voter_id_path, @driving_licence_path, @other_path)
      `);
    
    const patientId = patientResult.recordset[0]?.id;
    
    if (!patientId || typeof patientId !== 'number') {
        throw new Error("Failed to create patient record or retrieve ID.");
    }

    // Insert into admissions table
    const admissionRequest = new sql.Request(transaction);
    await admissionRequest
      .input('patient_id', sql.Int, patientId)
      .input('admission_id', sql.NVarChar, data.admission_id)
      .input('relationship_policyholder', sql.NVarChar, data.relationship_policyholder)
      .input('policy_number', sql.NVarChar, data.policy_number)
      .input('insured_card_number', sql.NVarChar, data.insured_card_number)
      .input('insurance_company', sql.NVarChar, data.company_id) // Storing company ID
      .input('policy_start_date', data.policy_start_date ? sql.Date : sql.Date, data.policy_start_date ? new Date(data.policy_start_date) : null)
      .input('policy_end_date', data.policy_end_date ? sql.Date : sql.Date, data.policy_end_date ? new Date(data.policy_end_date) : null)
      .input('sum_insured', sql.Decimal(18,2), data.sumInsured)
      .input('sum_utilized', sql.Decimal(18,2), data.sumUtilized)
      .input('total_sum', sql.Decimal(18,2), data.totalSum)
      .input('corporate_policy_number', sql.NVarChar, data.corporate_policy_number || null)
      .input('other_policy_name', sql.NVarChar, data.other_policy_name || null)
      .input('family_doctor_name', sql.NVarChar, data.family_doctor_name || null)
      .input('family_doctor_phone', sql.NVarChar, data.family_doctor_phone || null)
      .input('payer_email', sql.NVarChar, data.payer_email)
      .input('payer_phone', sql.NVarChar, data.payer_phone)
      .input('tpa_id', sql.Int, data.tpa_id)
      .input('hospital_id', sql.NVarChar, data.hospital_id || null)
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
      .input('roomNursingDietCost', sql.Decimal, data.roomNursingDietCost)
      .input('investigationCost', sql.Decimal, data.investigationCost)
      .input('icuCost', sql.Decimal, data.icuCost)
      .input('otCost', sql.Decimal, data.otCost)
      .input('professionalFees', sql.Decimal, data.professionalFees)
      .input('medicineCost', sql.Decimal, data.medicineCost)
      .input('otherHospitalExpenses', sql.Decimal, data.otherHospitalExpenses)
      .input('packageCharges', sql.Decimal, data.packageCharges)
      .input('totalExpectedCost', sql.Decimal, data.totalExpectedCost)
      .input('diabetesSince', sql.NVarChar, data.diabetesSince)
      .input('hypertensionSince', sql.NVarChar, data.hypertensionSince)
      .input('heartDiseaseSince', sql.NVarChar, data.heartDiseaseSince)
      .input('hyperlipidemiaSince', sql.NVarChar, data.hyperlipidemiaSince)
      .input('osteoarthritisSince', sql.NVarChar, data.osteoarthritisSince)
      .input('asthmaCopdSince', sql.NVarChar, data.asthmaCopdSince)
      .input('cancerSince', sql.NVarChar, data.cancerSince)
      .input('alcoholDrugAbuseSince', sql.NVarChar, data.alcoholDrugAbuseSince)
      .input('hivSince', sql.NVarChar, data.hivSince)
      .input('otherChronicAilment', sql.NVarChar, data.otherChronicAilment)
      .input('patientDeclarationName', sql.NVarChar, data.patientDeclarationName)
      .input('patientDeclarationContact', sql.NVarChar, data.patientDeclarationContact)
      .input('patientDeclarationEmail', sql.NVarChar, data.patientDeclarationEmail)
      .input('patientDeclarationDate', sql.Date, data.patientDeclarationDate ? new Date(data.patientDeclarationDate) : null)
      .input('patientDeclarationTime', sql.NVarChar, data.patientDeclarationTime)
      .input('hospitalDeclarationDoctorName', sql.NVarChar, data.hospitalDeclarationDoctorName)
      .input('hospitalDeclarationDate', sql.Date, data.hospitalDeclarationDate ? new Date(data.hospitalDeclarationDate) : null)
      .input('hospitalDeclarationTime', sql.NVarChar, data.hospitalDeclarationTime)
      .input('attachments', sql.NVarChar, data.attachments?.join(','))
      .query(`
          INSERT INTO admissions (
            patient_id, admission_id, relationship_policyholder, policy_number, insured_card_number, insurance_company, 
            policy_start_date, policy_end_date, sum_insured, sum_utilized, total_sum, corporate_policy_number, other_policy_name, family_doctor_name, 
            family_doctor_phone, payer_email, payer_phone, tpa_id, hospital_id, treat_doc_name, treat_doc_number, 
            treat_doc_qualification, treat_doc_reg_no,
            natureOfIllness, clinicalFindings, ailmentDuration, firstConsultationDate, pastHistory, provisionalDiagnosis,
            icd10Codes, treatmentMedical, treatmentSurgical, treatmentIntensiveCare, treatmentInvestigation,
            treatmentNonAllopathic, investigationDetails, drugRoute, procedureName, icd10PcsCodes, otherTreatments,
            isInjury, injuryCause, isRta, injuryDate, isReportedToPolice, firNumber, isAlcoholSuspected, isToxicologyConducted,
            isMaternity, g, p, l, a, expectedDeliveryDate,
            admissionDate, admissionTime, admissionType, expectedStay, expectedIcuStay, roomCategory, roomNursingDietCost,
            investigationCost, icuCost, otCost, professionalFees, medicineCost, otherHospitalExpenses, packageCharges,
            totalExpectedCost,
            diabetesSince, hypertensionSince, heartDiseaseSince, hyperlipidemiaSince, osteoarthritisSince, asthmaCopdSince,
            cancerSince, alcoholDrugAbuseSince, hivSince, otherChronicAilment,
            patientDeclarationName, patientDeclarationContact, patientDeclarationEmail, patientDeclarationDate, patientDeclarationTime,
            hospitalDeclarationDoctorName, hospitalDeclarationDate, hospitalDeclarationTime, attachments
          )
          VALUES (
            @patient_id, @admission_id, @relationship_policyholder, @policy_number, @insured_card_number, @insurance_company,
            @policy_start_date, @policy_end_date, @sum_insured, @sum_utilized, @total_sum, @corporate_policy_number, @other_policy_name, @family_doctor_name, 
            @family_doctor_phone, @payer_email, @payer_phone, @tpa_id, @hospital_id, @treat_doc_name, @treat_doc_number, 
            @treat_doc_qualification, @treat_doc_reg_no,
            @natureOfIllness, @clinicalFindings, @ailmentDuration, @firstConsultationDate, @pastHistory, @provisionalDiagnosis,
            @icd10Codes, @treatmentMedical, @treatmentSurgical, @treatmentIntensiveCare, @treatmentInvestigation,
            @treatmentNonAllopathic, @investigationDetails, @drugRoute, @procedureName, @icd10PcsCodes, @otherTreatments,
            @isInjury, @injuryCause, @isRta, @injuryDate, @isReportedToPolice, @firNumber, @isAlcoholSuspected, @isToxicologyConducted,
            @isMaternity, @g, @p, @l, @a, @expectedDeliveryDate,
            @admissionDate, @admissionTime, @admissionType, @expectedStay, @expectedIcuStay, @roomCategory, @roomNursingDietCost,
            @investigationCost, @icuCost, @otCost, @professionalFees, @medicineCost, @otherHospitalExpenses, @packageCharges,
            @totalExpectedCost,
            @diabetesSince, @hypertensionSince, @heartDiseaseSince, @hyperlipidemiaSince, @osteoarthritisSince, @asthmaCopdSince,
            @cancerSince, @alcoholDrugAbuseSince, @hivSince, @otherChronicAilment,
            @patientDeclarationName, @patientDeclarationContact, @patientDeclarationEmail, @patientDeclarationDate, @patientDeclarationTime,
            @hospitalDeclarationDoctorName, @hospitalDeclarationDate, @hospitalDeclarationTime, @attachments
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
  return { message: "Patient added successfully.", type: "success" };
}

export async function handleUpdatePatient(prevState: { message: string, type?: string }, formData: FormData) {
    const formObject = buildObjectFromFormData(formData);
    const validatedFields = updatePatientFormSchema.safeParse(formObject);

    if (!validatedFields.success) {
        const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
        return { message: `Invalid data: ${errorMessages}`, type: 'error' };
    }

    const { data } = validatedFields;
    const { id: patientId } = data;
    let transaction;

    try {
        await poolConnect;
        const db = pool;
        transaction = new sql.Transaction(db);
        await transaction.begin();

        // 1. Update Patients Table
        const photoJson = createDocumentJson(data.photoUrl, data.photoName);
        const adhaarJson = createDocumentJson(data.adhaar_path_url, data.adhaar_path_name);
        const panJson = createDocumentJson(data.pan_path_url, data.pan_path_name);
        const passportJson = createDocumentJson(data.passport_path_url, data.passport_path_name);
        const voterIdJson = createDocumentJson(data.voter_id_path_url, data.voter_id_path_name);
        const drivingLicenceJson = createDocumentJson(data.driving_licence_path_url, data.driving_licence_path_name);
        const otherJson = createDocumentJson(data.other_path_url, data.other_path_name);

        const patientRequest = new sql.Request(transaction);
        await patientRequest
            .input('id', sql.Int, Number(patientId))
            .input('first_name', sql.NVarChar, data.firstName)
            .input('last_name', sql.NVarChar, data.lastName)
            .input('email_address', sql.NVarChar, data.email_address)
            .input('phone_number', sql.NVarChar, data.phone_number || null)
            .input('alternative_number', sql.NVarChar, data.alternative_number || null)
            .input('gender', sql.NVarChar, data.gender)
            .input('age', sql.Int, data.age)
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
            .query(`
                UPDATE patients 
                SET 
                first_name = @first_name, last_name = @last_name, email_address = @email_address, phone_number = @phone_number, alternative_number = @alternative_number, 
                gender = @gender, age = @age, birth_date = @birth_date, address = @address, occupation = @occupation,
                employee_id = @employee_id, abha_id = @abha_id, health_id = @health_id, hospital_id = @hospital_id,
                photo = @photo, adhaar_path = @adhaar_path, pan_path = @pan_path, passport_path = @passport_path, 
                voter_id_path = @voter_id_path, driving_licence_path = @driving_licence_path, other_path = @other_path,
                updated_at = GETDATE()
                WHERE id = @id
            `);

        // 2. Update Admissions Table
        const admissionRequest = new sql.Request(transaction);
        await admissionRequest
            .input('patient_id', sql.Int, Number(patientId))
            .input('admission_id', sql.NVarChar, data.admission_id)
            .input('relationship_policyholder', sql.NVarChar, data.relationship_policyholder)
            .input('policy_number', sql.NVarChar, data.policy_number)
            .input('insured_card_number', sql.NVarChar, data.insured_card_number)
            .input('insurance_company', sql.NVarChar, data.company_id)
            .input('policy_start_date', data.policy_start_date ? sql.Date : sql.Date, data.policy_start_date ? new Date(data.policy_start_date) : null)
            .input('policy_end_date', data.policy_end_date ? sql.Date : sql.Date, data.policy_end_date ? new Date(data.policy_end_date) : null)
            .input('sum_insured', sql.Decimal(18,2), data.sumInsured)
            .input('sum_utilized', sql.Decimal(18,2), data.sumUtilized)
            .input('total_sum', sql.Decimal(18,2), data.totalSum)
            .input('corporate_policy_number', sql.NVarChar, data.corporate_policy_number || null)
            .input('other_policy_name', sql.NVarChar, data.other_policy_name || null)
            .input('family_doctor_name', sql.NVarChar, data.family_doctor_name || null)
            .input('family_doctor_phone', sql.NVarChar, data.family_doctor_phone || null)
            .input('payer_email', sql.NVarChar, data.payer_email)
            .input('payer_phone', sql.NVarChar, data.payer_phone)
            .input('tpa_id', sql.Int, data.tpa_id)
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
            .input('roomNursingDietCost', sql.Decimal, data.roomNursingDietCost)
            .input('investigationCost', sql.Decimal, data.investigationCost)
            .input('icuCost', sql.Decimal, data.icuCost)
            .input('otCost', sql.Decimal, data.otCost)
            .input('professionalFees', sql.Decimal, data.professionalFees)
            .input('medicineCost', sql.Decimal, data.medicineCost)
            .input('otherHospitalExpenses', sql.Decimal, data.otherHospitalExpenses)
            .input('packageCharges', sql.Decimal, data.packageCharges)
            .input('totalExpectedCost', sql.Decimal, data.totalExpectedCost)
            .input('diabetesSince', sql.NVarChar, data.diabetesSince)
            .input('hypertensionSince', sql.NVarChar, data.hypertensionSince)
            .input('heartDiseaseSince', sql.NVarChar, data.heartDiseaseSince)
            .input('hyperlipidemiaSince', sql.NVarChar, data.hyperlipidemiaSince)
            .input('osteoarthritisSince', sql.NVarChar, data.osteoarthritisSince)
            .input('asthmaCopdSince', sql.NVarChar, data.asthmaCopdSince)
            .input('cancerSince', sql.NVarChar, data.cancerSince)
            .input('alcoholDrugAbuseSince', sql.NVarChar, data.alcoholDrugAbuseSince)
            .input('hivSince', sql.NVarChar, data.hivSince)
            .input('otherChronicAilment', sql.NVarChar, data.otherChronicAilment)
            .input('patientDeclarationName', sql.NVarChar, data.patientDeclarationName)
            .input('patientDeclarationContact', sql.NVarChar, data.patientDeclarationContact)
            .input('patientDeclarationEmail', sql.NVarChar, data.patientDeclarationEmail)
            .input('patientDeclarationDate', sql.Date, data.patientDeclarationDate ? new Date(data.patientDeclarationDate) : null)
            .input('patientDeclarationTime', sql.NVarChar, data.patientDeclarationTime)
            .input('hospitalDeclarationDoctorName', sql.NVarChar, data.hospitalDeclarationDoctorName)
            .input('hospitalDeclarationDate', sql.Date, data.hospitalDeclarationDate ? new Date(data.hospitalDeclarationDate) : null)
            .input('hospitalDeclarationTime', sql.NVarChar, data.hospitalDeclarationTime)
            .input('attachments', sql.NVarChar, data.attachments?.join(','))
            .query(`
                UPDATE admissions
                SET 
                admission_id = @admission_id, relationship_policyholder = @relationship_policyholder, policy_number = @policy_number,
                insured_card_number = @insured_card_number, insurance_company = @insurance_company, policy_start_date = @policy_start_date,
                policy_end_date = @policy_end_date, sum_insured = @sum_insured, sum_utilized = @sum_utilized, total_sum = @total_sum, corporate_policy_number = @corporate_policy_number, other_policy_name = @other_policy_name,
                family_doctor_name = @family_doctor_name, family_doctor_phone = @family_doctor_phone, payer_email = @payer_email,
                payer_phone = @payer_phone, tpa_id = @tpa_id, treat_doc_name = @treat_doc_name,
                treat_doc_number = @treat_doc_number, treat_doc_qualification = @treat_doc_qualification, treat_doc_reg_no = @treat_doc_reg_no,
                natureOfIllness = @natureOfIllness, clinicalFindings = @clinicalFindings, ailmentDuration = @ailmentDuration, 
                firstConsultationDate = @firstConsultationDate, pastHistory = @pastHistory, provisionalDiagnosis = @provisionalDiagnosis, 
                icd10Codes = @icd10Codes, treatmentMedical = @treatmentMedical, treatmentSurgical = @treatmentSurgical, 
                treatmentIntensiveCare = @treatmentIntensiveCare, treatmentInvestigation = @treatmentInvestigation, 
                treatmentNonAllopathic = @treatmentNonAllopathic, investigationDetails = @investigationDetails, 
                drugRoute = @drugRoute, procedureName = @procedureName, icd10PcsCodes = @icd10PcsCodes, otherTreatments = @otherTreatments, 
                isInjury = @isInjury, injuryCause = @injuryCause, isRta = @isRta, injuryDate = @injuryDate, isReportedToPolice = @isReportedToPolice, 
                firNumber = @firNumber, isAlcoholSuspected = @isAlcoholSuspected, isToxicologyConducted = @isToxicologyConducted, 
                isMaternity = @isMaternity, g = @g, p = @p, l = @l, a = @a, expectedDeliveryDate = @expectedDeliveryDate, 
                admissionDate = @admissionDate, admissionTime = @admissionTime, admissionType = @admissionType, expectedStay = @expectedStay, 
                expectedIcuStay = @expectedIcuStay, roomCategory = @roomCategory, roomNursingDietCost = @roomNursingDietCost, 
                investigationCost = @investigationCost, icuCost = @icuCost, otCost = @otCost, professionalFees = @professionalFees, 
                medicineCost = @medicineCost, otherHospitalExpenses = @otherHospitalExpenses, packageCharges = @packageCharges, 
                totalExpectedCost = @totalExpectedCost, 
                diabetesSince = @diabetesSince, hypertensionSince = @hypertensionSince, heartDiseaseSince = @heartDiseaseSince, 
                hyperlipidemiaSince = @hyperlipidemiaSince, osteoarthritisSince = @osteoarthritisSince, asthmaCopdSince = @asthmaCopdSince, 
                cancerSince = @cancerSince, alcoholDrugAbuseSince = @alcoholDrugAbuseSince, hivSince = @hivSince,
                otherChronicAilment = @otherChronicAilment,
                patientDeclarationName = @patientDeclarationName, patientDeclarationContact = @patientDeclarationContact, patientDeclarationEmail = @patientDeclarationEmail, 
                patientDeclarationDate = @patientDeclarationDate, patientDeclarationTime = @patientDeclarationTime, 
                hospitalDeclarationDoctorName = @hospitalDeclarationDoctorName, hospitalDeclarationDate = @hospitalDeclarationDate, 
                hospitalDeclarationTime = @hospitalDeclarationTime, attachments = @attachments,
                updated_at = GETDATE()
                WHERE patient_id = @patient_id
            `);

        await handleSaveChiefComplaints(transaction, Number(patientId), data.chiefComplaints);

        await transaction.commit();

    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error('Error updating patient:', error);
        const dbError = error as { message?: string };
        return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: 'error' };
    }
    
    revalidatePath('/dashboard/patients');
    return { message: "Patient updated successfully.", type: "success" };
}


export async function handleDeletePatient(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
     if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }
    let transaction;

    try {
        await poolConnect;
        const db = pool;
        transaction = new sql.Transaction(db);
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
    await poolConnect;
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
        await poolConnect;
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

    

