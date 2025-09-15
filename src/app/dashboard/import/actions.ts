

"use server";

import * as XLSX from 'xlsx';
import { getDbPool, sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import nodemailer from "nodemailer";

async function sendEmail(requestData: { from: string, to?: string | null, subject?: string | null, html?: string | null }) {
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
            from: requestData.from,
            to: requestData.to || '',
            subject: requestData.subject || 'No Subject',
            html: requestData.html || '<p>No content provided.</p>',
        });
    } catch (error) {
        console.error("Failed to send email:", error);
        throw new Error("Failed to send email. Please check credentials and network.");
    }
}

export async function handleSendEmail(prevState: { message: string, type?: string }, formData: FormData) {
  const to = formData.get("to") as string;
  const from = formData.get("from") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  if (!to || !from || !subject || !body) {
    return { message: "All email fields are required.", type: 'error' };
  }

  try {
    await sendEmail({ to, from, subject, html: body });
    return { message: "Email sent successfully!", type: "success" };
  } catch (error) {
    const err = error as Error;
    return { message: err.message, type: "error" };
  }
}

export async function handleCreateTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createTpasTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tpas' and xtype='U')
      BEGIN
        CREATE TABLE tpas (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          email NVARCHAR(255),
          phone NVARCHAR(50),
          portalLink NVARCHAR(MAX),
          address NVARCHAR(MAX)
        );
      END
    `;
    await request.query(createTpasTableQuery);
    return { message: "TPA table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating TPA table:', dbError);
    return { message: `Error creating TPA table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateRelationshipTables(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    
    const createHospitalCompaniesQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospital_companies' and xtype='U')
      BEGIN
        CREATE TABLE hospital_companies (
          id INT IDENTITY(1,1) PRIMARY KEY,
          company_id NVARCHAR(255),
          hospital_id NVARCHAR(255)
        );
      END
    `;
    await request.query(createHospitalCompaniesQuery);

    const createHospitalTpasQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospital_tpas' and xtype='U')
      BEGIN
        CREATE TABLE hospital_tpas (
          id INT IDENTITY(1,1) PRIMARY KEY,
          tpa_id INT,
          hospital_id NVARCHAR(255)
        );
      END
    `;
    await request.query(createHospitalTpasQuery);

    const createHospitalStaffQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospital_staff' and xtype='U')
      BEGIN
        CREATE TABLE hospital_staff (
          id INT IDENTITY(1,1) PRIMARY KEY,
          staff_id NVARCHAR(255),
          hospital_id NVARCHAR(255)
        );
      END
    `;
    await request.query(createHospitalStaffQuery);

    return { message: "Relationship tables created successfully or already exist.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating relationship tables:', dbError);
    return { message: `Error creating relationship tables: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateHospitalTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createHospitalTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospitals' and xtype='U')
      BEGIN
        CREATE TABLE hospitals (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255),
          location NVARCHAR(255),
          address NVARCHAR(MAX),
          contact_person NVARCHAR(255),
          email NVARCHAR(255),
          phone NVARCHAR(50)
        );
      END
    `;
    await request.query(createHospitalTableQuery);
    return { message: "Hospital table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Hospital table:', dbError);
    return { message: `Error creating Hospital table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreatePatientsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createPatientsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='patients' and xtype='U')
      BEGIN
        CREATE TABLE patients (
          id INT IDENTITY(1,1) PRIMARY KEY,
          first_name NVARCHAR(255) NOT NULL,
          last_name NVARCHAR(255) NOT NULL,
          email_address NVARCHAR(255),
          phone_number NVARCHAR(50),
          alternative_number NVARCHAR(50),
          gender NVARCHAR(50),
          age INT,
          birth_date DATE,
          address NVARCHAR(MAX),
          occupation NVARCHAR(255),
          adhaar_path NVARCHAR(MAX),
          pan_path NVARCHAR(MAX),
          passport_path NVARCHAR(MAX),
          voter_id_path NVARCHAR(MAX),
          driving_licence_path NVARCHAR(MAX),
          other_path NVARCHAR(MAX),
          policy_path NVARCHAR(MAX),
          employee_id NVARCHAR(255),
          abha_id NVARCHAR(255),
          health_id NVARCHAR(255),
          hospital_id NVARCHAR(255),
          photo NVARCHAR(MAX),
          staff_id NVARCHAR(255),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
      END
      ELSE
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'staff_id' AND Object_ID = Object_ID(N'patients'))
        BEGIN
            ALTER TABLE patients ADD staff_id NVARCHAR(255);
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'policy_path' AND Object_ID = Object_ID(N'patients'))
        BEGIN
            ALTER TABLE patients ADD policy_path NVARCHAR(MAX);
        END
      END
    `;
    await request.query(createPatientsTableQuery);
    
    return { message: "Patients table created or altered successfully.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Patients table:', dbError);
    return { message: `Error creating Patients table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleUpdatePatientsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const columns_to_add = [
        { name: 'discharge_summary', type: 'NVARCHAR(MAX)' },
        { name: 'final_bill', type: 'NVARCHAR(MAX)' },
        { name: 'pharmacy_bill', type: 'NVARCHAR(MAX)' },
        { name: 'implant_bill', type: 'NVARCHAR(MAX)' },
        { name: 'lab_bill', type: 'NVARCHAR(MAX)' },
        { name: 'ot_notes', type: 'NVARCHAR(MAX)' },
        { name: 'status', type: 'NVARCHAR(50)' }
    ];

    let messages = [];

    for (const col of columns_to_add) {
        const checkColumnQuery = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'${col.name}' AND Object_ID = Object_ID(N'patients'))
            BEGIN
                ALTER TABLE patients ADD ${col.name} ${col.type};
            END
        `;
        await request.query(checkColumnQuery);
        messages.push(`Checked/Added column: ${col.name}`);
    }

    return { message: `Patients table updated successfully. ${messages.join(' ')}`, type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error updating Patients table:', dbError);
    return { message: `Error updating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateFieldsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createFieldsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fields' and xtype='U')
      BEGIN
        CREATE TABLE fields (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          type NVARCHAR(50) NOT NULL,
          required BIT NOT NULL,
          "order" INT NOT NULL,
          company_id NVARCHAR(255) NOT NULL,
          parent_id INT
        );
      END
    `;
    await request.query(createFieldsTableQuery);
    return { message: "Fields table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Fields table:', dbError);
    return { message: `Error creating Fields table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateFieldOptionsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createFieldOptionsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='field_options' and xtype='U')
      BEGIN
        CREATE TABLE field_options (
          id INT PRIMARY KEY IDENTITY,
          field_id INT NOT NULL,
          option_label VARCHAR(255) NOT NULL,
          option_value VARCHAR(255) NOT NULL,
          option_order INT NOT NULL
        );
      END
    `;
    await request.query(createFieldOptionsTableQuery);
    return { message: "Field options table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Field Options table:', dbError);
    return { message: `Error creating Field Options table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateAdmissionsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createAdmissionsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='admissions' and xtype='U')
      BEGIN
        CREATE TABLE admissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          patient_id INT,
          doctor_id INT,
          admission_id NVARCHAR(255),
          relationship_policyholder NVARCHAR(255),
          policy_number NVARCHAR(255),
          insured_card_number NVARCHAR(255),
          insurance_company NVARCHAR(255),
          policy_start_date DATE,
          policy_end_date DATE,
          sum_insured DECIMAL(18, 2),
          sum_utilized DECIMAL(18, 2),
          total_sum DECIMAL(18, 2),
          corporate_policy_number NVARCHAR(255),
          other_policy_name NVARCHAR(255),
          family_doctor_name NVARCHAR(255),
          family_doctor_phone NVARCHAR(50),
          payer_email NVARCHAR(255),
          payer_phone NVARCHAR(50),
          tpa_id INT,
          hospital_id NVARCHAR(255),
          treat_doc_name NVARCHAR(255),
          treat_doc_number NVARCHAR(50),
          treat_doc_qualification NVARCHAR(255),
          treat_doc_reg_no NVARCHAR(255),
          natureOfIllness NVARCHAR(MAX),
          clinicalFindings NVARCHAR(MAX),
          ailmentDuration INT,
          firstConsultationDate DATE,
          pastHistory NVARCHAR(MAX),
          provisionalDiagnosis NVARCHAR(MAX),
          icd10Codes NVARCHAR(255),
          treatmentMedical NVARCHAR(MAX),
          treatmentSurgical NVARCHAR(MAX),
          treatmentIntensiveCare NVARCHAR(MAX),
          treatmentInvestigation NVARCHAR(MAX),
          treatmentNonAllopathic NVARCHAR(MAX),
          investigationDetails NVARCHAR(MAX),
          drugRoute NVARCHAR(255),
          procedureName NVARCHAR(MAX),
          icd10PcsCodes NVARCHAR(255),
          otherTreatments NVARCHAR(MAX),
          isInjury BIT,
          injuryCause NVARCHAR(MAX),
          isRta BIT,
          injuryDate DATE,
          isReportedToPolice BIT,
          firNumber NVARCHAR(255),
          isAlcoholSuspected BIT,
          isToxicologyConducted BIT,
          isMaternity BIT,
          g INT,
          p INT,
          l INT,
          a INT,
          expectedDeliveryDate DATE,
          admissionDate DATE,
          admissionTime NVARCHAR(50),
          admissionType NVARCHAR(255),
          expectedStay INT,
          expectedIcuStay INT,
          roomCategory NVARCHAR(255),
          roomNursingDietCost DECIMAL(18, 2),
          investigationCost DECIMAL(18, 2),
          icuCost DECIMAL(18, 2),
          otCost DECIMAL(18, 2),
          professionalFees DECIMAL(18, 2),
          medicineCost DECIMAL(18, 2),
          otherHospitalExpenses DECIMAL(18, 2),
          packageCharges DECIMAL(18, 2),
          totalExpectedCost DECIMAL(18, 2),
          patientDeclarationName NVARCHAR(255),
          patientDeclarationContact NVARCHAR(50),
          patientDeclarationEmail NVARCHAR(255),
          patientDeclarationDate DATE,
          patientDeclarationTime NVARCHAR(50),
          hospitalDeclarationDoctorName NVARCHAR(255),
          hospitalDeclarationDate DATE,
          hospitalDeclarationTime NVARCHAR(50),
          attachments NVARCHAR(MAX),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          status NVARCHAR(50)
        );
      END
    `;
    await request.query(createAdmissionsTableQuery);
    return { message: "Admissions table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Admissions table:', dbError);
    return { message: `Error creating Admissions table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateIctCodeTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createIctCodeTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ict_code' and xtype='U')
      BEGIN
        CREATE TABLE ict_code (
          id INT IDENTITY(1,1) PRIMARY KEY,
          shortcode NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX) NOT NULL
        );
      END
    `;
    await request.query(createIctCodeTableQuery);
    return { message: "ICT Code table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating ICT Code table:', dbError);
    return { message: `Error creating ICT Code table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateDoctorsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createDoctorsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='doctors' and xtype='U')
      BEGIN
        CREATE TABLE doctors (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          email NVARCHAR(255),
          phone NVARCHAR(50),
          qualification NVARCHAR(255),
          reg_no NVARCHAR(100)
        );
      END
    `;
    await request.query(createDoctorsTableQuery);
    return { message: "Doctors table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Doctors table:', dbError);
    return { message: `Error creating Doctors table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}


export async function handleCreateChiefComplaintsTable(prevState: { message: string, type?: string }, formData: FormData) {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chief_complaints' AND xtype='U')
            BEGIN
                CREATE TABLE chief_complaints (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    patient_id INT NOT NULL,
                    complaint_name NVARCHAR(255) NOT NULL,
                    duration_value NVARCHAR(50),
                    duration_unit NVARCHAR(50),
                    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
                );
            END
        `;
        await request.query(query);
        return { message: "Chief Complaints table created successfully or already exists.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating Chief Complaints table:', dbError);
        return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}

export async function handleCreatePreAuthTable(prevState: { message: string, type?: string }, formData: FormData) {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='preauth_request' and xtype='U')
            BEGIN
              CREATE TABLE preauth_request (
                  id INT IDENTITY(1,1) PRIMARY KEY,
                  claim_id NVARCHAR(255),
                  patient_id INT,
                  admission_id NVARCHAR(255),
                  doctor_id INT,
                  status NVARCHAR(50),
                  first_name NVARCHAR(255),
                  last_name NVARCHAR(255),
                  email_address NVARCHAR(255),
                  phone_number NVARCHAR(50),
                  alternative_number NVARCHAR(50),
                  gender NVARCHAR(50),
                  age INT,
                  birth_date DATE,
                  address NVARCHAR(MAX),
                  occupation NVARCHAR(255),
                  employee_id NVARCHAR(255),
                  abha_id NVARCHAR(255),
                  health_id NVARCHAR(255),
                  relationship_policyholder NVARCHAR(255),
                  policy_number NVARCHAR(255),
                  insured_card_number NVARCHAR(255),
                  company_id NVARCHAR(255),
                  policy_start_date DATE,
                  policy_end_date DATE,
                  sum_insured DECIMAL(18, 2),
                  sum_utilized DECIMAL(18, 2),
                  total_sum DECIMAL(18, 2),
                  corporate_policy_number NVARCHAR(255),
                  other_policy_name NVARCHAR(255),
                  family_doctor_name NVARCHAR(255),
                  family_doctor_phone NVARCHAR(50),
                  payer_email NVARCHAR(255),
                  payer_phone NVARCHAR(50),
                  tpa_id INT,
                  hospital_id NVARCHAR(255),
                  hospital_name NVARCHAR(255),
                  treat_doc_name NVARCHAR(255),
                  treat_doc_number NVARCHAR(50),
                  treat_doc_qualification NVARCHAR(255),
                  treat_doc_reg_no NVARCHAR(255),
                  natureOfIllness NVARCHAR(MAX),
                  clinicalFindings NVARCHAR(MAX),
                  ailmentDuration INT,
                  firstConsultationDate DATE,
                  pastHistory NVARCHAR(MAX),
                  provisionalDiagnosis NVARCHAR(MAX),
                  icd10Codes NVARCHAR(255),
                  treatmentMedical NVARCHAR(MAX),
                  treatmentSurgical NVARCHAR(MAX),
                  treatmentIntensiveCare NVARCHAR(MAX),
                  treatmentInvestigation NVARCHAR(MAX),
                  treatmentNonAllopathic NVARCHAR(MAX),
                  investigationDetails NVARCHAR(MAX),
                  drugRoute NVARCHAR(255),
                  procedureName NVARCHAR(MAX),
                  icd10PcsCodes NVARCHAR(255),
                  otherTreatments NVARCHAR(MAX),
                  isInjury BIT,
                  injuryCause NVARCHAR(MAX),
                  isRta BIT,
                  injuryDate DATE,
                  isReportedToPolice BIT,
                  firNumber NVARCHAR(255),
                  isAlcoholSuspected BIT,
                  isToxicologyConducted BIT,
                  isMaternity BIT,
                  g INT,
                  p INT,
                  l INT,
                  a INT,
                  expectedDeliveryDate DATE,
                  admissionDate DATE,
                  admissionTime NVARCHAR(50),
                  admissionType NVARCHAR(255),
                  expectedStay INT,
                  expectedIcuStay INT,
                  roomCategory NVARCHAR(255),
                  roomNursingDietCost DECIMAL(18, 2),
                  investigationCost DECIMAL(18, 2),
                  icuCost DECIMAL(18, 2),
                  otCost DECIMAL(18, 2),
                  professionalFees DECIMAL(18, 2),
                  medicineCost DECIMAL(18, 2),
                  otherHospitalExpenses DECIMAL(18, 2),
                  packageCharges DECIMAL(18, 2),
                  totalExpectedCost DECIMAL(18, 2),
                  patientDeclarationName NVARCHAR(255),
                  patientDeclarationContact NVARCHAR(50),
                  patientDeclarationEmail NVARCHAR(255),
                  patientDeclarationDate DATE,
                  patientDeclarationTime NVARCHAR(50),
                  hospitalDeclarationDoctorName NVARCHAR(255),
                  hospitalDeclarationDate DATE,
                  hospitalDeclarationTime NVARCHAR(50),
                  attachments NVARCHAR(MAX),
                  created_at DATETIME DEFAULT GETDATE(),
                  CONSTRAINT FK__preauth_request__patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE NO ACTION
              );
            END
            ELSE
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'claim_id' AND Object_ID = Object_ID(N'preauth_request'))
                BEGIN
                    ALTER TABLE preauth_request ADD claim_id NVARCHAR(255);
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'reason' AND Object_ID = Object_ID(N'preauth_request'))
                BEGIN
                    ALTER TABLE preauth_request ADD reason NVARCHAR(MAX);
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'updated_at' AND Object_ID = Object_ID(N'preauth_request'))
                BEGIN
                    ALTER TABLE preauth_request ADD updated_at DATETIME DEFAULT GETDATE();
                END
                 IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'amount_sanctioned' AND Object_ID = Object_ID(N'preauth_request'))
                BEGIN
                    ALTER TABLE preauth_request ADD amount_sanctioned DECIMAL(18, 2);
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'staff_id' AND Object_ID = Object_ID(N'preauth_request'))
                BEGIN
                    ALTER TABLE preauth_request ADD staff_id NVARCHAR(255);
                END
            END
        `;
        await request.query(query);
        return { message: "Pre-Auth Request table created or altered successfully.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating or altering Pre-Auth table:', dbError);
        return { message: `Error creating/altering table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}


export async function handleAlterPreAuthTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const columns_to_add = [
        { name: 'photo', type: 'NVARCHAR(MAX)' },
        { name: 'adhaar_path', type: 'NVARCHAR(MAX)' },
        { name: 'pan_path', type: 'NVARCHAR(MAX)' },
        { name: 'passport_path', type: 'NVARCHAR(MAX)' },
        { name: 'voter_id_path', type: 'NVARCHAR(MAX)' },
        { name: 'driving_licence_path', type: 'NVARCHAR(MAX)' },
        { name: 'other_path', type: 'NVARCHAR(MAX)' }
    ];

    let messages = [];

    for (const col of columns_to_add) {
        const checkColumnQuery = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'${col.name}' AND Object_ID = Object_ID(N'preauth_request'))
            BEGIN
                ALTER TABLE preauth_request ADD ${col.name} ${col.type};
            END
        `;
        await request.query(checkColumnQuery);
        messages.push(`Checked/Added column: ${col.name}`);
    }

    return { message: `Pre-Auth table altered successfully. ${messages.join(' ')}`, type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error altering Pre-Auth table:', dbError);
    return { message: `Error altering table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateMedicalTable(prevState: { message: string, type?: string }, formData: FormData) {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const query = `
             IF OBJECT_ID('FK__medical__preauth', 'F') IS NOT NULL
                ALTER TABLE medical DROP CONSTRAINT FK__medical__preauth;

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medical' AND xtype='U')
            BEGIN
                CREATE TABLE medical (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    preauth_id INT,
                    complaint_name NVARCHAR(255) NOT NULL,
                    duration_value NVARCHAR(50),
                    duration_unit NVARCHAR(50),
                    CONSTRAINT FK__medical__preauth FOREIGN KEY (preauth_id) REFERENCES preauth_request(id) ON DELETE CASCADE
                );
            END
            ELSE
            BEGIN
                IF OBJECT_ID('FK__medical__preauth', 'F') IS NULL
                BEGIN
                    ALTER TABLE medical ADD CONSTRAINT FK__medical__preauth FOREIGN KEY (preauth_id) REFERENCES preauth_request(id) ON DELETE CASCADE;
                END
            END
        `;
        await request.query(query);
        return { message: "Medical table created/updated successfully or already exists.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating Medical table:', dbError);
        return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}

export async function handleCreateChatTable(prevState: { message: string, type?: string }, formData: FormData) {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const query = `
             IF OBJECT_ID('FK__chat__preauth', 'F') IS NOT NULL
                ALTER TABLE chat DROP CONSTRAINT FK__chat__preauth;

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chat' AND xtype='U')
            BEGIN
                CREATE TABLE chat (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    preauth_id INT,
                    from_email NVARCHAR(255),
                    to_email NVARCHAR(255),
                    subject NVARCHAR(MAX),
                    body NVARCHAR(MAX),
                    request_type NVARCHAR(255),
                    created_at DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK__chat__preauth FOREIGN KEY (preauth_id) REFERENCES preauth_request(id) ON DELETE CASCADE
                );
            END
            ELSE
            BEGIN
                 IF OBJECT_ID('FK__chat__preauth', 'F') IS NULL
                 BEGIN
                    ALTER TABLE chat ADD CONSTRAINT FK__chat__preauth FOREIGN KEY (preauth_id) REFERENCES preauth_request(id) ON DELETE CASCADE;
                 END
            END
        `;
        await request.query(query);
        return { message: "Chat table created/updated successfully or already exists.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating Chat table:', dbError);
        return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}

export async function handleCreateClaimsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createClaimsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='claims' and xtype='U')
      BEGIN
        CREATE TABLE claims (
          id INT IDENTITY(1,1) PRIMARY KEY,
          claim_id NVARCHAR(255) NULL,
          Patient_id INT,
          Patient_name NVARCHAR(255),
          admission_id NVARCHAR(255),
          status NVARCHAR(50),
          reason NVARCHAR(MAX),
          created_by NVARCHAR(255),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          paidAmount DECIMAL(18, 2),
          hospital_id NVARCHAR(255),
          amount DECIMAL(18, 2),
          tpa_id INT
        );
      END
      ELSE
      BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'paidAmount' AND Object_ID = Object_ID(N'claims'))
          BEGIN
              ALTER TABLE claims ADD paidAmount DECIMAL(18, 2);
          END
      END
    `;
    await request.query(createClaimsTableQuery);
    return { message: "Claims table created/updated successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Claims table:', dbError);
    return { message: `Error creating Claims table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateChatFilesTable(prevState: { message: string, type?: string }, formData: FormData) {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chat_files' AND xtype='U')
            BEGIN
                CREATE TABLE chat_files (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    chat_id INT,
                    path NVARCHAR(MAX) CHECK(ISJSON(path) = 1),
                    CONSTRAINT FK__chat_files__chat FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE
                );
            END
        `;
        await request.query(query);
        return { message: "Chat Files table created successfully or already exists.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating Chat Files table:', dbError);
        return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}


export async function handleDeleteClaimsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const dropClaimsTableQuery = `DROP TABLE IF EXISTS claims`;
    await request.query(dropClaimsTableQuery);
    return { message: "Claims table deleted successfully.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error deleting Claims table:', dbError);
    return { message: `Error deleting Claims table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleDeletePreAuthRequestTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();

    const dropChatConstraintQuery = `
      IF OBJECT_ID('FK__chat__preauth', 'F') IS NOT NULL
      ALTER TABLE chat DROP CONSTRAINT FK__chat__preauth;
    `;
    await request.query(dropChatConstraintQuery);
    
    const dropMedicalConstraintQuery = `
      IF OBJECT_ID('FK__medical__preauth', 'F') IS NOT NULL
      ALTER TABLE medical DROP CONSTRAINT FK__medical__preauth;
    `;
    await request.query(dropMedicalConstraintQuery);

    const dropPreAuthRequestTableQuery = `DROP TABLE IF EXISTS preauth_request`;
    await request.query(dropPreAuthRequestTableQuery);
    
    return { message: "Pre-Auth Request table deleted successfully.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error deleting Pre-Auth Request table:', dbError);
    return { message: `Error deleting Pre-Auth Request table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleAdmissionsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createAdmissionsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='admissions' and xtype='U')
      BEGIN
        CREATE TABLE admissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          patient_id INT,
          admission_id NVARCHAR(255),
          -- other admission fields...
          status NVARCHAR(50)
        );
      END
      ELSE
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'status' AND Object_ID = Object_ID(N'admissions'))
        BEGIN
            ALTER TABLE admissions ADD status NVARCHAR(50);
        END
      END
    `;
    await request.query(createAdmissionsTableQuery);
    return { message: "Admissions table created or updated successfully.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    return { message: `Error handling Admissions table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateInvoicesTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createInvoicesTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' and xtype='U')
      BEGIN
        CREATE TABLE Invoices (
          id INT IDENTITY(1,1) PRIMARY KEY,
          "to" NVARCHAR(255),
          hospital NVARCHAR(255),
          address NVARCHAR(MAX),
          period NVARCHAR(255),
          contract_type NVARCHAR(255),
          service_provided NVARCHAR(MAX),
          bank_name NVARCHAR(255),
          account_name NVARCHAR(255),
          account_number NVARCHAR(50),
          ifsc_code NVARCHAR(50),
          branch NVARCHAR(255),
          staff_id NVARCHAR(255),
          created_at DATETIME DEFAULT GETDATE()
        );
      END
    `;
    await request.query(createInvoicesTableQuery);
    return { message: "Invoices table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    return { message: `Error creating Invoices table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateInvoiceStaffTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createInvoiceStaffTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='invoice_staff' and xtype='U')
      BEGIN
        CREATE TABLE invoice_staff (
          id INT IDENTITY(1,1) PRIMARY KEY,
          description NVARCHAR(MAX),
          qty INT,
          rate DECIMAL(18, 2),
          total DECIMAL(18, 2),
          amount DECIMAL(18, 2),
          invoice_id INT,
          staff_id NVARCHAR(255)
        );
      END
    `;
    await request.query(createInvoiceStaffTableQuery);
    return { message: "Invoice Staff table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    return { message: `Error creating Invoice Staff table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateAttendanceTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    const createAttendanceTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attendance' and xtype='U')
      BEGIN
        CREATE TABLE attendance (
          id INT IDENTITY(1,1) PRIMARY KEY,
          staff_id NVARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          status NVARCHAR(50) NOT NULL,
          CONSTRAINT UQ_staff_date UNIQUE (staff_id, date)
        );
      END
    `;
    await request.query(createAttendanceTableQuery);
    return { message: "Attendance table created successfully or already exists.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Attendance table:', dbError);
    return { message: `Error creating Attendance table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}
