
"use server";

import { revalidatePath } from 'next/cache';
import { getDbPool, sql } from '@/lib/db';
import { z } from 'zod';
import { logActivity } from '@/lib/activity-log';

const companySettingsSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  gst_no: z.string().optional(),
  pan_no: z.string().optional(),
  contact_no: z.string().optional(),
  banking_details: z.string().optional(),
  account_name: z.string().optional(),
  bank_name: z.string().optional(),
  branch: z.string().optional(),
  account_no: z.string().optional(),
  ifsc_code: z.string().optional(),
  header_img: z.string().optional().nullable(),
  footer_img: z.string().optional().nullable(),
});

export type CompanySettings = z.infer<typeof companySettingsSchema>;

export async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
  if (!companyId) return null;
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('company_id', sql.NVarChar, companyId)
      .query('SELECT * FROM company_settings WHERE company_id = @company_id');
    
    if (result.recordset.length > 0) {
      return result.recordset[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching company settings:", error);
    throw new Error("Failed to fetch company settings.");
  }
}

export async function addOrUpdateCompanySettings(prevState: { message: string, type?: string }, formData: FormData) {
  const companyId = formData.get('companyId') as string;
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;

  if (!companyId) {
    return { message: "Company ID is missing.", type: "error" };
  }

  const validatedFields = companySettingsSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return { message: "Invalid data submitted.", type: "error" };
  }
  
  const { data } = validatedFields;

  try {
    const pool = await getDbPool();
    const existingSettings = await getCompanySettings(companyId);

    const request = pool.request().input('company_id', sql.NVarChar, companyId);
    
    Object.entries(data).forEach(([key, value]) => {
        request.input(key, sql.NVarChar, value || null);
    });

    if (existingSettings) {
      // Update
      const setClauses = Object.keys(data).map(key => `${key} = @${key}`).join(', ');
      await request.query(`UPDATE company_settings SET ${setClauses} WHERE company_id = @company_id`);
       await logActivity({
            userId,
            userName,
            actionType: 'UPDATE_COMPANY',
            details: `Updated company profile settings.`,
            targetId: companyId,
            targetType: 'Company'
        });
    } else {
      // Insert
      const columns = Object.keys(data).join(', ');
      const values = Object.keys(data).map(key => `@${key}`).join(', ');
      await request.query(`INSERT INTO company_settings (company_id, ${columns}) VALUES (@company_id, ${values})`);
      await logActivity({
            userId,
            userName,
            actionType: 'CREATE_COMPANY',
            details: `Created company profile settings.`,
            targetId: companyId,
            targetType: 'Company'
        });
    }

    revalidatePath('/dashboard/company-settings');
    return { message: "Settings saved successfully!", type: "success" };

  } catch (error) {
    console.error("Error saving company settings:", error);
    const dbError = error as Error;
    return { message: `Database error: ${dbError.message}`, type: "error" };
  }
}
