
"use server";

import pool, { sql, poolConnect } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from 'zod';

const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required."),
  type: z.enum(["Text", "Dropdown", "Radio", "Checkbox", "Number", "Textarea"]),
  required: z.boolean(),
  companyId: z.string().min(1, "Company ID is required."),
});

export type Field = {
    id: number,
    name: string,
    type: string,
    required: boolean,
    companyId: string,
}


export async function getFields(companyId: string): Promise<Field[]> {
  try {
    await poolConnect;
    const result = await pool.request()
        .input('company_id', sql.NVarChar, companyId)
        .query('SELECT * FROM fields WHERE company_id = @company_id ORDER BY name');
    return result.recordset as Field[];
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching fields: ${dbError.message}`);
  }
}


export async function handleAddField(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = fieldSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    required: formData.get("required") === "on",
    companyId: formData.get("companyId"),
  });
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { data } = validatedFields;

  try {
    await poolConnect;
    await pool.request()
      .input('name', sql.NVarChar, data.name)
      .input('type', sql.NVarChar, data.type)
      .input('required', sql.Bit, data.required)
      .input('company_id', sql.NVarChar, data.companyId)
      .query(`INSERT INTO fields (name, type, required, company_id) VALUES (@name, @type, @required, @company_id)`);

  } catch (error) {
    console.error('Error adding field:', error);
    const dbError = error as { message?: string };
    if (dbError.message?.includes('Violation of UNIQUE KEY')) {
        return { message: `A field with the name "${data.name}" already exists for this company.`, type: 'error'};
    }
    return { message: `Database Error: ${dbError.message || 'Unknown error'}`, type: "error" };
  }

  revalidatePath('/dashboard/fields');
  return { message: "Field added successfully.", type: "success" };
}


export async function handleDeleteField(prevState: { message: string, type?: string }, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
      return { message: "Delete error: ID is missing", type: 'error' };
    }

    try {
        await poolConnect;
        const result = await pool.request()
            .input('id', sql.Int, Number(id))
            .query('DELETE FROM fields WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { message: "Field not found.", type: 'error' };
        }
    } catch (error) {
        console.error('Database error:', error);
        return { message: "Database error during deletion.", type: 'error' };
    }
    
    revalidatePath('/dashboard/fields');
    return { message: "Field deleted successfully.", type: 'success' };
}
