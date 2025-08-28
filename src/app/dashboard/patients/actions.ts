
"use server";

import pool, { sql, poolConnect } from "@/lib/db";
import { Patient } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const phoneRegex = new RegExp(/^\d{10}$/);

const basePatientFormSchema = z.object({
  // Patient Details
  name: z.string().min(1, "Full Name is required."),
  email_address: z.string().email("Invalid email address.").min(1, "Email is required."),
  phone_number: z.string().regex(phoneRegex, 'Registered mobile number must be 10 digits'),
  alternative_number: z.string().regex(phoneRegex, 'Alternate number must be 10 digits').optional().or(z.literal('')),
  gender: z.string().min(1, "Gender is required."),
  age: z.coerce.number().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  address: z.string().min(1, "Address is required."),
  occupation: z.string().optional().nullable(),
  employee_id: z.string().optional().nullable(),
  abha_id: z.string().optional().nullable(),
  health_id: z.string().optional().nullable(),
  image_url: z.any().optional().nullable(),
  
  // KYC Documents
  adhaar_path: z.any().optional().nullable(),
  pan_path: z.any().optional().nullable(),
  passport_path: z.any().optional().nullable(),
  voter_id_path: z.any().optional().nullable(),
  driving_licence_path: z.any().optional().nullable(),
  other_path: z.any().optional().nullable(),

  // Insurance Details
  admission_id: z.string().min(1, "Admission ID is required."),
  relationship_policyholder: z.string().min(1, "Relationship to policyholder is required."),
  policy_number: z.string().min(1, "Policy number is required."),
  insured_card_number: z.string().min(1, "Insured member/card ID number is required."),
  company_id: z.string().min(1, "Insurance Company is required."),
  policy_start_date: z.string().min(1, "Policy Start Date is required."),
  policy_end_date: z.string().min(1, "Policy End Date is required."),
  corporate_policy_number: z.string().optional().nullable(),
  other_policy_name: z.string().optional().nullable(),
  family_doctor_name: z.string().optional().nullable(),
  family_doctor_phone: z.string().regex(phoneRegex, 'Family doctor phone must be 10 digits').optional().or(z.literal('')),
  payer_email: z.string().email("Invalid email for Proposer/Payer.").min(1, "Proposer/Payer email is required."),
  payer_phone: z.string().regex(phoneRegex, 'Payer phone number must be 10 digits'),
  
  // Hospital & TPA
  tpa_id: z.coerce.number({required_error: "TPA is required."}),
  hospital_id: z.string().optional().nullable(),
  treat_doc_name: z.string().min(1, "Treating doctor’s name is required."),
  treat_doc_number: z.string().regex(phoneRegex, "Treating doctor's contact must be 10 digits"),
  treat_doc_qualification: z.string().min(1, "Doctor’s qualification is required."),
  treat_doc_reg_no: z.string().min(1, "Doctor’s registration no. is required."),
});

const refinement = (data: z.infer<typeof basePatientFormSchema>) => 
  (data.age !== null && data.age !== undefined && data.age > 0) || 
  (data.birth_date !== null && data.birth_date !== undefined && data.birth_date !== '');

const addPatientFormSchema = basePatientFormSchema.refine(refinement, {
  message: "Either Age or Date of birth is required.",
  path: ["age"], 
});

const updatePatientFormSchema = basePatientFormSchema.extend({
  id: z.string(), // Patient ID
}).refine(refinement, {
    message: "Either Age or Date of birth is required.",
    path: ["age"],
});


export async function getPatients(): Promise<Patient[]> {
  try {
    await poolConnect;
    const result = await pool.request()
      .query(`
        SELECT p.id, p.name as fullName, p.email_address, p.phone_number as phoneNumber, a.policy_number as policyNumber, c.name as companyName
        FROM patients p
        LEFT JOIN admissions a ON p.id = a.patient_id
        LEFT JOIN companies c ON a.insurance_company = c.id
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
      .input('id', sql.Int, Number(id))
       .query(`
        SELECT 
          p.id,
          p.name as fullName, 
          p.email_address,
          p.phone_number as phoneNumber,
          p.alternative_number,
          p.gender,
          p.age,
          p.birth_date as dateOfBirth,
          p.address,
          p.occupation,
          p.employee_id,
          p.abha_id,
          p.health_id,
          p.image_url,
          a.admission_id,
          a.relationship_policyholder,
          a.policy_number as policyNumber,
          a.insured_card_number as memberId,
          a.insurance_company as companyId,
          c.name as companyName,
          a.policy_start_date as policyStartDate,
          a.policy_end_date as policyEndDate,
          a.corporate_policy_number,
          a.other_policy_name,
          a.family_doctor_name,
          a.family_doctor_phone,
          a.payer_email,
          a.payer_phone,
          a.tpa_id,
          a.hospital_id,
          a.treat_doc_name,
          a.treat_doc_number,
          a.treat_doc_qualification,
          a.treat_doc_reg_no
        FROM patients p
        LEFT JOIN admissions a ON p.id = a.patient_id
        LEFT JOIN companies c ON a.insurance_company = c.id
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

async function uploadFileToS3(file: Buffer, fileName: string): Promise<string> {
    const s3Client = new S3Client({
        region: process.env.AWS_S3_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `patients/${fileName}`,
        Body: file,
        ContentType: 'image/jpeg', // Assuming jpeg, adjust if needed
        ACL: 'public-read' as const,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/patients/${fileName}`;
}


export async function handleAddPatient(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = addPatientFormSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { data } = validatedFields;
  let transaction;
  let imageUrl: string | null = null;
  const imageFile = formData.get("image_url") as File;
  
  if (imageFile && imageFile.size > 0) {
      const { AWS_S3_BUCKET_NAME, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
      if (!AWS_S3_BUCKET_NAME || !AWS_S3_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
          return { message: "S3 credentials are not configured. Cannot upload image.", type: 'error' };
      }
      try {
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const fileName = `patient_${Date.now()}_${imageFile.name}`;
          imageUrl = await uploadFileToS3(buffer, fileName);
      } catch (error) {
          console.error("Error uploading image to S3", error);
          return { message: "Failed to upload patient image.", type: 'error' };
      }
  }


  try {
    await poolConnect;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    // Insert into patients table
    const patientRequest = new sql.Request(transaction);
    const patientResult = await patientRequest
      .input('name', sql.NVarChar, data.name)
      .input('email_address', sql.NVarChar, data.email_address)
      .input('phone_number', sql.NVarChar, data.phone_number)
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
      .input('image_url', sql.NVarChar, imageUrl)
      // NOTE: KYC fields (adhaar_path, etc.) are ignored for now as file upload is not implemented.
      .query(`
        INSERT INTO patients (name, email_address, phone_number, alternative_number, gender, age, birth_date, address, occupation, employee_id, abha_id, health_id, hospital_id, image_url)
        OUTPUT INSERTED.id
        VALUES (@name, @email_address, @phone_number, @alternative_number, @gender, @age, @birth_date, @address, @occupation, @employee_id, @abha_id, @health_id, @hospital_id, @image_url)
      `);
    
    const patientId = patientResult.recordset[0]?.id;
    
    if (!patientId || typeof patientId !== 'number') {
        throw new Error("Failed to create patient record or retrieve ID.");
    }

    // Insert into admissions table
    const admissionRequest = new sql.Request(transaction);
    await admissionRequest
      .input('admission_id', sql.NVarChar, data.admission_id)
      .input('relationship_policyholder', sql.NVarChar, data.relationship_policyholder)
      .input('policy_number', sql.NVarChar, data.policy_number)
      .input('insured_card_number', sql.NVarChar, data.insured_card_number)
      .input('insurance_company', sql.NVarChar, data.company_id) // Storing company ID
      .input('policy_start_date', data.policy_start_date ? sql.Date : sql.Date, data.policy_start_date ? new Date(data.policy_start_date) : null)
      .input('policy_end_date', data.policy_end_date ? sql.Date : sql.Date, data.policy_end_date ? new Date(data.policy_end_date) : null)
      .input('corporate_policy_number', sql.NVarChar, data.corporate_policy_number || null)
      .input('other_policy_name', sql.NVarChar, data.other_policy_name || null)
      .input('family_doctor_name', sql.NVarChar, data.family_doctor_name || null)
      .input('family_doctor_phone', sql.NVarChar, data.family_doctor_phone || null)
      .input('payer_email', sql.NVarChar, data.payer_email)
      .input('payer_phone', sql.NVarChar, data.payer_phone)
      .input('tpa_id', sql.Int, data.tpa_id)
      .input('hospital_id', sql.NVarChar, data.hospital_id || null)
      .input('patient_id', sql.Int, patientId)
      .input('treat_doc_name', sql.NVarChar, data.treat_doc_name)
      .input('treat_doc_number', sql.NVarChar, data.treat_doc_number)
      .input('treat_doc_qualification', sql.NVarChar, data.treat_doc_qualification)
      .input('treat_doc_reg_no', sql.NVarChar, data.treat_doc_reg_no)
      .query(`
          INSERT INTO admissions (admission_id, relationship_policyholder, policy_number, insured_card_number, insurance_company, policy_start_date, policy_end_date, corporate_policy_number, other_policy_name, family_doctor_name, family_doctor_phone, payer_email, payer_phone, tpa_id, hospital_id, patient_id, treat_doc_name, treat_doc_number, treat_doc_qualification, treat_doc_reg_no)
          VALUES (@admission_id, @relationship_policyholder, @policy_number, @insured_card_number, @insurance_company, @policy_start_date, @policy_end_date, @corporate_policy_number, @other_policy_name, @family_doctor_name, @family_doctor_phone, @payer_email, @payer_phone, @tpa_id, @hospital_id, @patient_id, @treat_doc_name, @treat_doc_number, @treat_doc_qualification, @treat_doc_reg_no)
      `);

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
  const validatedFields = updatePatientFormSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { data } = validatedFields;
  const { id: patientId } = data;
  let transaction;

  let imageUrl: string | null = null;
  const imageFile = formData.get("image_url") as File;

  if (imageFile && imageFile.size > 0) {
      const { AWS_S3_BUCKET_NAME, AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
      if (!AWS_S3_BUCKET_NAME || !AWS_S3_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
          return { message: "S3 credentials are not configured. Cannot upload image.", type: 'error' };
      }
      try {
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const fileName = `patient_${Date.now()}_${imageFile.name}`;
          imageUrl = await uploadFileToS3(buffer, fileName);
      } catch (error) {
          console.error("Error uploading image to S3", error);
          return { message: "Failed to upload patient image.", type: 'error' };
      }
  }


  try {
    await poolConnect;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Update patients table
    const patientRequest = new sql.Request(transaction);
    let patientUpdateQuery = `
        UPDATE patients 
        SET 
          name = @name, email_address = @email_address, phone_number = @phone_number, alternative_number = @alternative_number, 
          gender = @gender, age = @age, birth_date = @birth_date, address = @address, occupation = @occupation,
          employee_id = @employee_id, abha_id = @abha_id, health_id = @health_id, updated_at = GETDATE()
    `;
    
    patientRequest
      .input('id', sql.Int, Number(patientId))
      .input('name', sql.NVarChar, data.name)
      .input('email_address', sql.NVarChar, data.email_address)
      .input('phone_number', sql.NVarChar, data.phone_number)
      .input('alternative_number', sql.NVarChar, data.alternative_number || null)
      .input('gender', sql.NVarChar, data.gender)
      .input('age', sql.Int, data.age)
      .input('birth_date', data.birth_date ? sql.Date : sql.Date, data.birth_date ? new Date(data.birth_date) : null)
      .input('address', sql.NVarChar, data.address)
      .input('occupation', sql.NVarChar, data.occupation || null)
      .input('employee_id', sql.NVarChar, data.employee_id || null)
      .input('abha_id', sql.NVarChar, data.abha_id || null)
      .input('health_id', sql.NVarChar, data.health_id || null)

    if(imageUrl) {
        patientUpdateQuery += `, image_url = @image_url`;
        patientRequest.input('image_url', sql.NVarChar, imageUrl);
    }
      
    patientUpdateQuery += ` WHERE id = @id`;
    await patientRequest.query(patientUpdateQuery);


    // Update admissions table
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
      .query(`
        UPDATE admissions
        SET 
          admission_id = @admission_id, relationship_policyholder = @relationship_policyholder, policy_number = @policy_number,
          insured_card_number = @insured_card_number, insurance_company = @insurance_company, policy_start_date = @policy_start_date,
          policy_end_date = @policy_end_date, corporate_policy_number = @corporate_policy_number, other_policy_name = @other_policy_name,
          family_doctor_name = @family_doctor_name, family_doctor_phone = @family_doctor_phone, payer_email = @payer_email,
          payer_phone = @payer_phone, tpa_id = @tpa_id, hospital_id = @hospital_id, treat_doc_name = @treat_doc_name,
          treat_doc_number = @treat_doc_number, treat_doc_qualification = @treat_doc_qualification, treat_doc_reg_no = @treat_doc_reg_no,
          updated_at = GETDATE()
        WHERE patient_id = @patient_id
      `);

    await transaction.commit();

  } catch (error) {
    if(transaction) await transaction.rollback();
    console.error('Error updating patient:', error);
    const dbError = error as { message?: string };
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  
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
        transaction = new sql.Transaction(pool);
        await transaction.begin();

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
