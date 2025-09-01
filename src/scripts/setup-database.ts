

import pool, { poolConnect, sql } from '@/lib/db';
import { mockUsers } from '@/lib/mock-data';

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await poolConnect; // Wait for the initial connection to be established
    const request = pool.request();
    console.log('Connection successful.');

    // Create Users Table
    console.log('Checking for "users" table...');
    const createUsersTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
      CREATE TABLE users (
        uid NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        role NVARCHAR(50) NOT NULL,
        companyId NVARCHAR(255),
        password NVARCHAR(255),
        designation NVARCHAR(255),
        department NVARCHAR(255),
        joiningDate DATE,
        endDate DATE,
        shiftTime NVARCHAR(100),
        status NVARCHAR(50),
        number NVARCHAR(50)
      );
    `;
    await request.query(createUsersTableQuery);
    console.log('"users" table created or already exists.');

    // Seed Users Table
    console.log('Seeding users table...');
    for (const user of mockUsers) {
      const password = user.password || 'password'; 

      const checkUserRequest = pool.request();
      const userExistsResult = await checkUserRequest
        .input('email_check', sql.NVarChar, user.email)
        .query('SELECT uid FROM users WHERE email = @email_check');

      if (userExistsResult.recordset.length === 0) {
        const insertRequest = pool.request();
        await insertRequest
          .input('uid', sql.NVarChar, user.uid)
          .input('name', sql.NVarChar, user.name)
          .input('email', sql.NVarChar, user.email)
          .input('role', sql.NVarChar, user.role)
          .input('companyId', sql.NVarChar, user.companyId)
          .input('password', sql.NVarChar, password)
          .input('designation', sql.NVarChar, user.designation)
          .input('department', sql.NVarChar, user.department)
          .input('joiningDate', user.joiningDate ? sql.Date : sql.Date, user.joiningDate ? new Date(user.joiningDate) : null)
          .input('endDate', user.endDate ? sql.Date : sql.Date, user.endDate ? new Date(user.endDate) : null)
          .input('shiftTime', sql.NVarChar, user.shiftTime)
          .input('status', sql.NVarChar, user.status)
          .input('number', sql.NVarChar, user.number)
          .query(`
              INSERT INTO users (uid, name, email, role, companyId, password, designation, department, joiningDate, endDate, shiftTime, status, number) 
              VALUES (@uid, @name, @email, @role, @companyId, @password, @designation, @department, @joiningDate, @endDate, @shiftTime, @status, @number)
          `);
        console.log(`Inserted user: ${user.email}`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    }
    console.log('User seeding complete.');


    // Create Companies Table
    console.log('Checking for "companies" table...');
    const createCompaniesTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='companies' and xtype='U')
      BEGIN
        CREATE TABLE companies (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          contactPerson NVARCHAR(255),
          phone NVARCHAR(50),
          email NVARCHAR(255),
          address NVARCHAR(MAX),
          portalLink NVARCHAR(MAX)
        );
        PRINT '"companies" table created.';
      END
      ELSE
      BEGIN
          PRINT '"companies" table already exists.';
      END
    `;
    await request.query(createCompaniesTableQuery);
    console.log('Companies table check/create complete.');
    
    // Create TPAs Table
    console.log('Checking for "tpas" table...');
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
        PRINT '"tpas" table created.';
      END
      ELSE
      BEGIN
          PRINT '"tpas" table already exists.';
      END
    `;
    await request.query(createTpasTableQuery);
    console.log('TPAs table check/create complete.');
    
    // Create Token Blacklist Table
    console.log('Checking for "token_blacklist" table...');
    const createTokenBlacklistTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='token_blacklist' and xtype='U')
      BEGIN
        CREATE TABLE token_blacklist (
          id INT IDENTITY(1,1) PRIMARY KEY,
          token NVARCHAR(MAX) NOT NULL,
          expires_at DATETIME NOT NULL
        );
        PRINT '"token_blacklist" table created.';
      END
      ELSE
      BEGIN
          PRINT '"token_blacklist" table already exists.';
      END
    `;
    await request.query(createTokenBlacklistTableQuery);
    console.log('Token blacklist table check/create complete.');

    // Create Patients Table
    console.log('Checking for "patients" table...');
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
        PRINT '"patients" table created.';
      END
      ELSE
      BEGIN
        PRINT '"patients" table already exists.';
        -- Add columns if they don't exist
        const columns_to_add = [
            { name: 'photo', type: 'NVARCHAR(MAX)' },
            { name: 'adhaar_path', type: 'NVARCHAR(MAX)' },
            { name: 'pan_path', type: 'NVARCHAR(MAX)' },
            { name: 'passport_path', type: 'NVARCHAR(MAX)' },
            { name: 'voter_id_path', type: 'NVARCHAR(MAX)' },
            { name: 'driving_licence_path', type: 'NVARCHAR(MAX)' },
            { name: 'other_path', type: 'NVARCHAR(MAX)' }
        ];

        for (const col of columns_to_add) {
            const checkColumnQuery = \`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'\${col.name}' AND Object_ID = Object_ID(N'patients'))
                BEGIN
                    ALTER TABLE patients ADD \${col.name} \${col.type};
                    PRINT 'Added "\${col.name}" column to "patients" table.';
                END
            \`;
            await request.query(checkColumnQuery);
        }
      END
    `;
    await request.query(createPatientsTableQuery);
    console.log('Patients table check/create complete.');

    // Create Admissions Table
     console.log('Checking for "admissions" table...');
    const createAdmissionsTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='admissions' and xtype='U')
      BEGIN
        CREATE TABLE admissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          patient_id INT,
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
        PRINT '"admissions" table created.';
      END
       ELSE
      BEGIN
          PRINT '"admissions" table already exists.';
      END
    `;
    await request.query(createAdmissionsTableQuery);
    console.log('Admissions table check/create complete.');


    console.log('Database setup complete!');

  } catch (err) {
    console.error('Error during database setup:', err);
    process.exit(1);
  } finally {
    await pool.close();
    console.log('Database connection closed.');
  }
}

setupDatabase();
