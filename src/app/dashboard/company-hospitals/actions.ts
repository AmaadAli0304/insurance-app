

"use server";

import { redirect } from 'next/navigation';
import pool, { sql, poolConnect } from "@/lib/db";
import type { Staff, Company, TPA, Hospital } from "@/lib/types";
import { z } from "zod";
import { logActivity } from '@/lib/activity-log';

// Schemas for validation
const hospitalSchema = z.object({
    name: z.string().min(1, "Hospital name is required"),
    location: z.string().optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    photoUrl: z.string().optional().nullable(),
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
        const result = await db.request().query('SELECT id, name, location, address, contact_person as contactPerson, email, phone, photo FROM hospitals WHERE archived IS NULL OR archived = 0');
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
            .query('SELECT id, name, location, address, contact_person as contactPerson, email, phone, photo FROM hospitals WHERE id = @id');

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
export async function handleAddHospital(
    prevState: { message: string, type?: string }, 
    formData: FormData
) {
    const userId = formData.get('userId') as string;
    const userName = formData.get('userName') as string;

    const validatedFields = hospitalSchema.safeParse({
        name: formData.get("name"),
        location: formData.get("location"),
        contactPerson: formData.get("contactPerson"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
        photoUrl: formData.get("photoUrl")
    });

    if (!validatedFields.success) {
        return { message: "Invalid data: " + validatedFields.error.errors.map(e => e.message).join(', '), type: 'error' };
    }
    
    const { data } = validatedFields;

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
            .input('name', sql.NVarChar, data.name)
            .input('location', sql.NVarChar, data.location || null)
            .input('address', sql.NVarChar, data.address || null)
            .input('contact_person', sql.NVarChar, data.contactPerson || null)
            .input('email', sql.NVarChar, data.email || null)
            .input('phone', sql.NVarChar, data.phone || null)
            .input('photo', sql.NVarChar, data.photoUrl || null)
            .query(`INSERT INTO hospitals (id, name, location, address, contact_person, email, phone, photo) 
                    VALUES (@id, @name, @location, @address, @contact_person, @email, @phone, @photo)`);
        
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

        await logActivity({
            userId,
            userName,
            actionType: 'CREATE_HOSPITAL',
            details: `Created a new hospital: ${data.name}`,
            targetId: hospitalId,
            targetType: 'Hospital'
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Database error:", error);
        return { message: "Failed to add hospital to the database.", type: 'error' };
    }

    return { message: "Hospital added successfully", type: 'success' };
}

export async function handleUpdateHospital(prevState: { message: string, type?:string }, formData: FormData) {
    const userId = formData.get('userId') as string;
    const userName = formData.get('userName') as string;

    const validatedFields = hospitalUpdateSchema.safeParse({
        id: formData.get("id"),
        name: formData.get("name"),
        location: formData.get("location"),
        contactPerson: formData.get("contactPerson"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
        photoUrl: formData.get("photoUrl")
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
            .input('photo', sql.NVarChar, hospitalData.photoUrl)
            .query(`UPDATE hospitals SET name = @name, location = @location, address = @address, contact_person = @contact_person, email = @email, phone = @phone, photo = @photo 
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

        await logActivity({
            userId,
            userName,
            actionType: 'UPDATE_HOSPITAL',
            details: `Updated hospital: ${hospitalData.name}`,
            targetId: hospitalId,
            targetType: 'Hospital'
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Database error:", error);
        return { message: "Failed to update hospital in the database.", type: 'error' };
    }

    return { message: "Hospital updated successfully.", type: "success" };
}

export async function handleDeleteHospital(prevState: { message: string, type?:string }, formData: FormData) {
    const id = formData.get("id") as string;
    const userId = formData.get('userId') as string;
    const userName = formData.get('userName') as string;
    const hospitalName = formData.get('hospitalName') as string;

    if (!id) {
      return { message: "Archive error: ID is missing", type: 'error' };
    }
    
    try {
        const db = await poolConnect;
        const result = await db.request()
            .input('id', sql.NVarChar, id)
            .query('UPDATE hospitals SET archived = 1 WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "Hospital not found.", type: 'error' };
        }

        await logActivity({
            userId,
            userName,
            actionType: 'ARCHIVE_HOSPITAL',
            details: `Archived hospital: ${hospitalName}`,
            targetId: id,
            targetType: 'Hospital'
        });

    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during archival.", type: 'error' };
    }
    
    return { message: "Hospital archived successfully.", type: 'success' };
}
  

    
