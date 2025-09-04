
"use server";

import { redirect } from 'next/navigation';
import { getDbPool, sql } from "@/lib/db";
import { Claim, ClaimStatus } from "@/lib/types";
import { revalidatePath } from 'next/cache';

export async function getClaims(hospitalId?: string | null): Promise<Claim[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();

        let whereClause = '';
        if (hospitalId) {
            request.input('hospitalId', sql.NVarChar, hospitalId);
            whereClause = 'LEFT JOIN preauth_request pr ON cl.admission_id = pr.admission_id WHERE pr.hospital_id = @hospitalId';
        }

        const result = await request.query(`
            SELECT 
                cl.*,
                h.name as hospitalName,
                pr.totalExpectedCost as claimAmount,
                pr.policy_number as policyNumber,
                co.name as companyName
            FROM claims cl
            LEFT JOIN preauth_request pr ON cl.admission_id = pr.admission_id
            LEFT JOIN hospitals h ON pr.hospital_id = h.id
            LEFT JOIN companies co ON pr.company_id = co.id
            ${whereClause}
            ORDER BY cl.created_at DESC
        `);

        return result.recordset as Claim[];
    } catch (error) {
        console.error("Error fetching claims:", error);
        throw new Error("Failed to fetch claims from database.");
    }
}

export async function getClaimById(id: string): Promise<Claim | null> {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .input('id', sql.Int, Number(id))
            .query(`
                 SELECT 
                    cl.*,
                    h.name as hospitalName,
                    pr.totalExpectedCost as claimAmount,
                    pr.policy_number as policyNumber,
                    co.name as companyName,
                    pr.id as preauth_request_id,
                    pr.natureOfIllness as request_subject
                FROM claims cl
                LEFT JOIN preauth_request pr ON cl.admission_id = pr.admission_id
                LEFT JOIN hospitals h ON pr.hospital_id = h.id
                LEFT JOIN companies co ON pr.company_id = co.id
                WHERE cl.id = @id
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset[0] as Claim;
    } catch (error) {
        console.error("Error fetching claim by ID:", error);
        throw new Error("Failed to fetch claim details from database.");
    }
}


export async function handleAddClaim(prevState: { message: string }, formData: FormData) {
  // This function might need to be adjusted based on how new claims are created
  // For now, it's a placeholder. New claims are created via pre-auth.
  console.log("handleAddClaim is not fully implemented for DB yet.");
  return { message: "This functionality is now handled via Pre-Authorization." };
}

export async function handleUpdateClaim(prevState: { message: string, type?: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as ClaimStatus;
  const reason = formData.get("reason") as string;
  const paidAmount = formData.get("paidAmount") as string;
  const claim_id = formData.get("claim_id") as string;

  if (!id || !status) {
    return { message: "Required fields are missing.", type: 'error' };
  }

  try {
    const pool = await getDbPool();
    await pool.request()
        .input('id', sql.Int, Number(id))
        .input('status', sql.NVarChar, status)
        .input('reason', sql.NVarChar, reason)
        .input('claim_id', sql.NVarChar, claim_id)
        .input('updated_at', sql.DateTime, new Date())
        // In a real scenario, you'd calculate paid amount server-side or have more complex logic
        .query('UPDATE claims SET status = @status, reason = @reason, claim_id = @claim_id, updated_at = @updated_at WHERE id = @id');

  } catch (error) {
      console.error("Error updating claim:", error);
      return { message: "Database error while updating claim.", type: 'error' };
  }

  revalidatePath('/dashboard/claims');
  return { message: "Claim updated successfully.", type: "success" };
}

export async function handleDeleteClaim(formData: FormData) {
    const id = formData.get("id") as string;
    try {
        const pool = await getDbPool();
        await pool.request()
            .input('id', sql.Int, Number(id))
            .query('DELETE FROM claims WHERE id = @id');
    } catch (error) {
        console.error("Error deleting claim:", error);
        // Consider returning an error state to the client
    }
    revalidatePath('/dashboard/claims');
}
