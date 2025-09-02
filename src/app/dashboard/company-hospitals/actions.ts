
"use server";

import { redirect } from 'next/navigation';
import pool, { sql, poolConnect } from "@/lib/db";
import type { Staff, Company, TPA, Hospital } from "@/lib/types";
import { z } from "zod";

// Schemas for validation
const hospitalSchema = z.object({
    name: z.string().min(1, "Hospital name is required"),
    location: z.string().optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
});

const hospitalUpdateSchema = hospitalSchema.extend({
    id: z.string(),
});


// Data fetching functions
export async function getStaff(): Promise<Pick<Staff, 'id' | 'name'>[]> {
  try {
    const db = await poolConnect;
    const result = await db.request().query("SELECT uid as id, name FROM users WHERE role = 'Hospital Staff'");
    return result.recordset as Pick<Staff, 'id' | 'name'>[];
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching staff: ${dbError.message}`);
  }
}

export async function getCompaniesForForm(): Promise<Pick<Company, 'id' | 'name'>[]> {
  try {
    const db = await poolConnect;
    const result = await db.request().query('SELECT id, name FROM companies');
    return result.recordset;
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching companies for form: ${dbError.message}`);
  }
}

export async function getTPAsForForm(): Promise<Pick<TPA, 'id' | 'name'>[]> {
  try {
    const db = await poolConnect;
    const result = await db.request().query('SELECT id, name FROM tpas');
    return result.recordset.map(r => ({ ...r, id: r.id.toString() }));
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching TPAs for form: ${dbError.message}`);
  }
}

export async function getHospitals(): Promise<Hospital[]> {
    try {
        const db = await poolConnect;
        const result = await db.request().query('SELECT id, name, location, address, contact_person as contactPerson, email, phone FROM hospitals');
        return result.recordset as Hospital[];
    } catch (error) {
        const dbError = error as Error;
        throw new Error(`Error fetching hospitals: ${dbError.message}`);
    }
}

export async function getHospitalById(id: string): Promise<Hospital | null> {
    try {
        const db = await poolConnect;
        const hospitalResult = await db.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT id, name, location, address, contact_person as contactPerson, email, phone FROM hospitals WHERE id = @id');

        if (hospitalResult.recordset.length === 0) {
            return null;
        }

        const hospital = hospitalResult.recordset[0] as Hospital;

        const [companiesResult, tpasResult, staffResult] = await Promise.all([
            db.request().input('hospital_id', sql.NVarChar, id).query('SELECT company_id FROM hospital_companies WHERE hospital_id = @hospital_id'),
            db.request().input('hospital_id', sql.NVarChar, id).query('SELECT tpa_id FROM hospital_tpas WHERE hospital_id = @hospital_id'),
            db.request().input('hospital_id', sql.NVarChar, id).query('SELECT staff_id FROM hospital_staff WHERE hospital_id = @hospital_id')
        ]);
        
        hospital.assignedCompanies = companiesResult.recordset.map(r => r.company_id);
        hospital.assignedTPAs = tpasResult.recordset.map(r => String(r.tpa_id));
        hospital.assignedStaff = staffResult.recordset.map(r => r.staff_id);

        return hospital;
    } catch (error) {
        console.error("Error fetching hospital by ID:", error);
        throw new Error("Failed to fetch hospital details from database.");
    }
}


// CRUD Actions
export async function handleAddHospital(prevState: { message: string, type?:string }, formData: FormData) {
    const validatedFields = hospitalSchema.safeParse({
        name: formData.get("name"),
        location: formData.get("location"),
        contactPerson: formData.get("contactPerson"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
    });

    if (!validatedFields.success) {
        return { message: "Invalid data: " + validatedFields.error.errors.map(e => e.message).join(', '), type: 'error' };
    }

    const assignedCompanies = (formData.get("assignedInsuranceCompanies") as string || '').split(',').filter(Boolean);
    const assignedTPAs = (formData.get("assignedTPAs") as string || '').split(',').filter(Boolean);
    const assignedStaff = (formData.get("assignedStaff") as string || '').split(',').filter(Boolean);
    
    const hospitalId = `hosp-${Date.now()}`;
    let transaction;

    try {
        const db = await poolConnect;
        transaction = new sql.Transaction(db);
        await transaction.begin();

        const hospitalRequest = new sql.Request(transaction);
        await hospitalRequest
            .input('id', sql.NVarChar, hospitalId)
            .input('name', sql.NVarChar, validatedFields.data.name)
            .input('location', sql.NVarChar, validatedFields.data.location)
            .input('address', sql.NVarChar, validatedFields.data.address)
            .input('contact_person', sql.NVarChar, validatedFields.data.contactPerson)
            .input('email', sql.NVarChar, validatedFields.data.email)
            .input('phone', sql.NVarChar, validatedFields.data.phone)
            .query(`INSERT INTO hospitals (id, name, location, address, contact_person, email, phone) 
                    VALUES (@id, @name, @location, @address, @contact_person, @email, @phone)`);
        
        // Insert into relationship tables
        for (const companyId of assignedCompanies) {
            await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).input('company_id', sql.NVarChar, companyId).query('INSERT INTO hospital_companies (hospital_id, company_id) VALUES (@hospital_id, @company_id)');
        }
        for (const tpaId of assignedTPAs) {
            await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).input('tpa_id', sql.Int, Number(tpaId)).query('INSERT INTO hospital_tpas (hospital_id, tpa_id) VALUES (@hospital_id, @tpa_id)');
        }
        for (const staffId of assignedStaff) {
            await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).input('staff_id', sql.NVarChar, staffId).query('INSERT INTO hospital_staff (hospital_id, staff_id) VALUES (@hospital_id, @staff_id)');
        }

        await transaction.commit();
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Database error:", error);
        return { message: "Failed to add hospital to the database.", type: 'error' };
    }

    return { message: "Hospital added successfully", type: 'success' };
}

export async function handleUpdateHospital(prevState: { message: string, type?:string }, formData: FormData) {
    const validatedFields = hospitalUpdateSchema.safeParse({
        id: formData.get("id"),
        name: formData.get("name"),
        location: formData.get("location"),
        contactPerson: formData.get("contactPerson"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
    });

    if (!validatedFields.success) {
        return { message: "Invalid data: " + validatedFields.error.errors.map(e => e.message).join(', '), type: 'error' };
    }

    const { id: hospitalId, ...hospitalData } = validatedFields.data;
    const assignedCompanies = (formData.get("assignedInsuranceCompanies") as string || '').split(',').filter(Boolean);
    const assignedTPAs = (formData.get("assignedTPAs") as string || '').split(',').filter(Boolean);
    const assignedStaff = (formData.get("assignedStaff") as string || '').split(',').filter(Boolean);
    
    let transaction;
    try {
        const db = await poolConnect;
        transaction = new sql.Transaction(db);
        await transaction.begin();

        const hospitalRequest = new sql.Request(transaction);
        await hospitalRequest
            .input('id', sql.NVarChar, hospitalId)
            .input('name', sql.NVarChar, hospitalData.name)
            .input('location', sql.NVarChar, hospitalData.location)
            .input('address', sql.NVarChar, hospitalData.address)
            .input('contact_person', sql.NVarChar, hospitalData.contactPerson)
            .input('email', sql.NVarChar, hospitalData.email)
            .input('phone', sql.NVarChar, hospitalData.phone)
            .query(`UPDATE hospitals SET name = @name, location = @location, address = @address, contact_person = @contact_person, email = @email, phone = @phone 
                    WHERE id = @id`);

        // Clear existing associations
        await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).query('DELETE FROM hospital_companies WHERE hospital_id = @hospital_id');
        await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).query('DELETE FROM hospital_tpas WHERE hospital_id = @hospital_id');
        await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).query('DELETE FROM hospital_staff WHERE hospital_id = @hospital_id');

        // Insert new associations
        for (const companyId of assignedCompanies) {
            await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).input('company_id', sql.NVarChar, companyId).query('INSERT INTO hospital_companies (hospital_id, company_id) VALUES (@hospital_id, @company_id)');
        }
        for (const tpaId of assignedTPAs) {
            await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).input('tpa_id', sql.Int, Number(tpaId)).query('INSERT INTO hospital_tpas (hospital_id, tpa_id) VALUES (@hospital_id, @tpa_id)');
        }
        for (const staffId of assignedStaff) {
            await new sql.Request(transaction).input('hospital_id', sql.NVarChar, hospitalId).input('staff_id', sql.NVarChar, staffId).query('INSERT INTO hospital_staff (hospital_id, staff_id) VALUES (@hospital_id, @staff_id)');
        }
        
        await transaction.commit();
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Database error:", error);
        return { message: "Failed to update hospital in the database.", type: 'error' };
    }

    return { message: "Hospital updated successfully.", type: "success" };
}

export async function handleDeleteHospital(prevState: { message: string, type?:string }, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }
    
    let transaction;
    try {
        const db = await poolConnect;
        transaction = new sql.Transaction(db);
        await transaction.begin();

        // Delete from relationship tables first
        await new sql.Request(transaction).input('hospital_id', sql.NVarChar, id).query('DELETE FROM hospital_companies WHERE hospital_id = @hospital_id');
        await new sql.Request(transaction).input('hospital_id', sql.NVarChar, id).query('DELETE FROM hospital_tpas WHERE hospital_id = @hospital_id');
        await new sql.Request(transaction).input('hospital_id', sql.NVarChar, id).query('DELETE FROM hospital_staff WHERE hospital_id = @hospital_id');
        
        // Delete from main hospital table
        const result = await new sql.Request(transaction).input('id', sql.NVarChar, id).query('DELETE FROM hospitals WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return { message: "Hospital not found.", type: 'error' };
        }
        
        await transaction.commit();

    } catch (error) {
        if(transaction) await transaction.rollback();
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    return { message: "Hospital deleted successfully.", type: 'success' };
}
