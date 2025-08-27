
"use server";

import pool, { sql, poolConnect } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from 'zod';
import { Company } from "@/lib/types";


const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required."),
  type: z.enum(["Text", "Dropdown", "Radio", "Checkbox", "Number", "Textarea", "Date"]),
  required: z.boolean(),
  companyId: z.string().min(1, "Company ID is required."),
  order: z.coerce.number().int("Order must be a whole number."),
  parent_id: z.coerce.number().int("Parent ID must be a number").optional().nullable(),
  options: z.string().optional(),
});

export type Field = {
    id: number,
    name: string,
    type: string,
    required: boolean,
    companyId: string,
    companyName?: string;
}


export async function getFields(): Promise<Field[]> {
  try {
    await poolConnect;
    const request = pool.request();
    let query = 'SELECT f.*, c.name as companyName FROM fields f JOIN companies c ON f.company_id = c.id ORDER BY c.name, f.name';
    
    const result = await request.query(query);
    return result.recordset as Field[];
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching fields: ${dbError.message}`);
  }
}

export async function getCompaniesForForm(): Promise<Pick<Company, 'id' | 'name'>[]> {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT id, name FROM companies ORDER BY name');
    return result.recordset;
  } catch (error) {
    const dbError = error as Error;
    throw new Error(`Error fetching companies for form: ${dbError.message}`);
  }
}


export async function handleAddField(prevState: { message: string, type?: string }, formData: FormData) {
  const validatedFields = fieldSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    required: formData.get("required") === "on",
    companyId: formData.get("companyId"),
    order: formData.get("order"),
    parent_id: formData.get("parent_id") || null,
    options: formData.get("options") as string,
  });
  
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
    return { message: `Invalid data: ${errorMessages}`, type: 'error' };
  }
  
  const { data } = validatedFields;
  let transaction;

  try {
    await poolConnect;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const fieldRequest = new sql.Request(transaction)
      .input('name', sql.NVarChar, data.name)
      .input('type', sql.NVarChar, data.type)
      .input('required', sql.Bit, data.required)
      .input('company_id', sql.NVarChar, data.companyId)
      .input('order', sql.Int, data.order);
      
    if (data.parent_id) {
        fieldRequest.input('parent_id', sql.Int, data.parent_id);
    } else {
        fieldRequest.input('parent_id', sql.Int, null);
    }
      
    const result = await fieldRequest.query(`
        INSERT INTO fields (name, type, required, company_id, "order", parent_id) 
        OUTPUT INSERTED.id
        VALUES (@name, @type, @required, @company_id, @order, @parent_id)
    `);

    const fieldId = result.recordset[0].id;

    if (data.options && (data.type === 'Dropdown' || data.type === 'Radio' || data.type === 'Checkbox')) {
        const options = JSON.parse(data.options);
        if (Array.isArray(options) && options.length > 0) {
            for (const [index, option] of options.entries()) {
                if (option.label && option.value) {
                    const optionRequest = new sql.Request(transaction);
                    await optionRequest
                        .input('field_id', sql.Int, fieldId)
                        .input('option_label', sql.NVarChar, option.label)
                        .input('option_value', sql.NVarChar, option.value)
                        .input('option_order', sql.Int, index)
                        .query(`INSERT INTO field_options (field_id, option_label, option_value, option_order) VALUES (@field_id, @option_label, @option_value, @option_order)`);
                }
            }
        }
    }

    await transaction.commit();

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
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
