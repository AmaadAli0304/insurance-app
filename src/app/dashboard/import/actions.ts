
"use server";

import * as XLSX from 'xlsx';
import pool, { sql, poolConnect } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function handleCreateTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    await poolConnect;
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
    await poolConnect;
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
    await poolConnect;
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
    await poolConnect;
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
          employee_id NVARCHAR(255),
          abha_id NVARCHAR(255),
          health_id NVARCHAR(255),
          hospital_id NVARCHAR(255),
          photo NVARCHAR(MAX),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
      END
    `;
    await request.query(createPatientsTableQuery);
    
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
          diabetesSince NVARCHAR(50),
          hypertensionSince NVARCHAR(50),
          heartDiseaseSince NVARCHAR(50),
          hyperlipidemiaSince NVARCHAR(50),
          osteoarthritisSince NVARCHAR(50),
          asthmaCopdSince NVARCHAR(50),
          cancerSince NVARCHAR(50),
          alcoholDrugAbuseSince NVARCHAR(50),
          hivSince NVARCHAR(50),
          otherChronicAilment NVARCHAR(MAX),
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
          updated_at DATETIME DEFAULT GETDATE()
        );
      END
    `;
    await request.query(createAdmissionsTableQuery);

    return { message: "Patients and Admissions tables created successfully or already exist.", type: "success" };
  } catch (error) {
    const dbError = error as { message?: string };
    console.error('Error creating Patients/Admissions tables:', dbError);
    return { message: `Error creating Patients/Admissions tables: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
  }
}

export async function handleCreateFieldsTable(prevState: { message: string, type?: string }, formData: FormData) {
  try {
    await poolConnect;
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
    await poolConnect;
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
    await poolConnect;
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
          diabetesSince NVARCHAR(50),
          hypertensionSince NVARCHAR(50),
          heartDiseaseSince NVARCHAR(50),
          hyperlipidemiaSince NVARCHAR(50),
          osteoarthritisSince NVARCHAR(50),
          asthmaCopdSince NVARCHAR(50),
          cancerSince NVARCHAR(50),
          alcoholDrugAbuseSince NVARCHAR(50),
          hivSince NVARCHAR(50),
          otherChronicAilment NVARCHAR(MAX),
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
          updated_at DATETIME DEFAULT GETDATE()
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
    await poolConnect;
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
    await poolConnect;
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
        await poolConnect;
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
        await poolConnect;
        const request = pool.request();
        const query = `
            IF OBJECT_ID('preauth', 'U') IS NOT NULL
            BEGIN
              -- Drop constraints if they exist
              IF OBJECT_ID('FK_preauth_patient', 'F') IS NOT NULL
                  ALTER TABLE preauth DROP CONSTRAINT FK_preauth_patient;
              
              DROP TABLE preauth;
            END

            CREATE TABLE preauth (
                id INT IDENTITY(1,1) PRIMARY KEY,
                patient_id INT,
                admission_id NVARCHAR(255),
                -- Patient Details
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
                photo NVARCHAR(MAX),
                -- KYC
                adhaar_path NVARCHAR(MAX),
                pan_path NVARCHAR(MAX),
                passport_path NVARCHAR(MAX),
                voter_id_path NVARCHAR(MAX),
                driving_licence_path NVARCHAR(MAX),
                other_path NVARCHAR(MAX),
                -- Insurance
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
                doctor_id INT,
                treat_doc_name NVARCHAR(255),
                treat_doc_number NVARCHAR(50),
                treat_doc_qualification NVARCHAR(255),
                treat_doc_reg_no NVARCHAR(255),
                -- Clinical Info
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
                -- Declarations
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
                CONSTRAINT FK_preauth_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            );
        `;
        await request.query(query);
        return { message: "Pre-Auth table re-created successfully.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating Pre-Auth table:', dbError);
        return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}

export async function handleCreateMedicalTable(prevState: { message: string, type?: string }, formData: FormData) {
    try {
        await poolConnect;
        const request = pool.request();
        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medical' AND xtype='U')
            BEGIN
                CREATE TABLE medical (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    preauth_id INT,
                    complaint_name NVARCHAR(255) NOT NULL,
                    duration_value NVARCHAR(50),
                    duration_unit NVARCHAR(50),
                    FOREIGN KEY (preauth_id) REFERENCES preauth(id) ON DELETE CASCADE
                );
            END
        `;
        await request.query(query);
        return { message: "Medical table created successfully or already exists.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating Medical table:', dbError);
        return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}

export async function handleCreateChatTable(prevState: { message: string, type?: string }, formData: FormData) {
    try {
        await poolConnect;
        const request = pool.request();
        const query = `
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
                    FOREIGN KEY (preauth_id) REFERENCES preauth(id) ON DELETE CASCADE
                );
            END
        `;
        await request.query(query);
        return { message: "Chat table created successfully or already exists.", type: "success" };
    } catch (error) {
        const dbError = error as { message?: string };
        console.error('Error creating Chat table:', dbError);
        return { message: `Error creating table: ${dbError.message || 'An unknown error occurred.'}`, type: "error" };
    }
}
