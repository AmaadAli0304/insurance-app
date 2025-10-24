

"use server";

import { redirect } from 'next/navigation';
import { getDbPool, sql } from "@/lib/db";
import { Claim, ClaimStatus } from "@/lib/types";
import { revalidatePath } from 'next/cache';

const getDocumentData = (jsonString: string | null | undefined): { url: string; name: string } | null => {
    if (!jsonString) return null;
    try {
        const parsed = JSON.parse(jsonString);
        if (typeof parsed === 'object' && parsed !== null && 'url' in parsed) {
            return { url: parsed.url, name: parsed.name || 'View Document' };
        }
    } catch (e) {
        if (typeof jsonString === 'string' && jsonString.startsWith('http')) {
            return { url: jsonString, name: 'View Document' };
        }
    }
    return null;
};


export async function getClaims(hospitalId?: string | null, page: number = 1, limit: number = 10): Promise<{ claims: Claim[], total: number }> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const countRequest = pool.request();
        
        let whereClauses: string[] = [];
        if (hospitalId) {
            request.input('hospitalId', sql.NVarChar, hospitalId);
            countRequest.input('hospitalId', sql.NVarChar, hospitalId);
            whereClauses.push('cl.hospital_id = @hospitalId');
        }
        
        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query to get the total count of unique claims
        const countQuery = `
            SELECT COUNT(*) as total
            FROM (
                SELECT 
                    ROW_NUMBER() OVER(PARTITION BY cl.Patient_id ORDER BY cl.updated_at DESC) as rn
                FROM claims cl
                ${whereClause}
            ) AS RankedClaims
            WHERE rn = 1;
        `;

        const totalResult = await countRequest.query(countQuery);
        const total = totalResult.recordset[0].total;

        // Paginated query to get the claims
        const offset = (page - 1) * limit;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);
        
        const dataQuery = `
            WITH RankedClaims AS (
                SELECT 
                    cl.*,
                    h.name as hospitalName,
                    co.name as companyName,
                    p.photo as patientPhoto,
                    p.first_name + ' ' + p.last_name as Patient_name_from_patient,
                    ROW_NUMBER() OVER(PARTITION BY cl.Patient_id ORDER BY cl.updated_at DESC) as rn
                FROM claims cl
                LEFT JOIN hospitals h ON cl.hospital_id = h.id
                LEFT JOIN patients p ON cl.Patient_id = p.id
                LEFT JOIN preauth_request pr ON cl.admission_id = pr.admission_id
                LEFT JOIN companies co ON pr.company_id = co.id
                ${whereClause}
            )
            SELECT *
            FROM RankedClaims
            WHERE rn = 1
            ORDER BY updated_at DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY;
        `;


        const result = await request.query(dataQuery);

        const claims = result.recordset.map(record => {
             const photoData = getDocumentData(record.patientPhoto);
             return {
                ...record,
                Patient_name: record.Patient_name_from_patient || record.Patient_name,
                patientPhoto: photoData?.url || null,
                claimAmount: record.amount 
            }
        }) as Claim[];
        
        return { claims, total };

    } catch (error) {
        console.error("Error fetching claims:", error);
        throw new Error("Failed to fetch claims from database.");
    }
}

export async function getClaimById(id: string): Promise<Claim | null> {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query(`
                 SELECT 
                    cl.*,
                    h.name as hospitalName,
                    COALESCE(co_pr.name, co_adm.name) as companyName,
                    pr.natureOfIllness,
                    p.first_name + ' ' + p.last_name as PatientFullName,
                    pr.id as preauthId,
                    pr.totalExpectedCost as BilledAmount
                FROM claims cl
                LEFT JOIN patients p ON cl.Patient_id = p.id
                LEFT JOIN hospitals h ON cl.hospital_id = h.id
                LEFT JOIN preauth_request pr ON cl.admission_id = pr.admission_id
                LEFT JOIN companies co_pr ON pr.company_id = co_pr.id
                LEFT JOIN admissions adm ON cl.admission_id = adm.admission_id
                LEFT JOIN companies co_adm ON adm.insurance_company = co_adm.id
                WHERE cl.id = @id
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        const record = result.recordset[0];
        record.Patient_name = record.PatientFullName; // Use the correct full name

        return record as Claim;
    } catch (error) {
        console.error("Error fetching claim by ID:", error);
        throw new Error("Failed to fetch claim details from database.");
    }
}

export async function getClaimsByPatientId(patientId: number): Promise<Claim[]> {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .input('patientId', sql.Int, patientId)
            .query(`
                SELECT 
                    cl.id,
                    cl.status,
                    cl.reason,
                    cl.amount,
                    cl.updated_at
                FROM claims cl
                WHERE cl.Patient_id = @patientId
                ORDER BY cl.updated_at DESC
            `);
        return result.recordset as Claim[];
    } catch (error) {
        console.error("Error fetching claims by patient ID:", error);
        throw new Error("Failed to fetch claim history from the database.");
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
  const final_amount = formData.get("final_amount") as string;
  const now = new Date();

  if (!id || !status) {
    return { message: "Required fields are missing.", type: 'error' };
  }

  let transaction;
  try {
    const pool = await getDbPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // 1. Update the 'claims' table
    let claimsUpdateQuery = 'UPDATE claims SET status = @status, reason = @reason, claim_id = @claim_id, updated_at = @updated_at';
    const claimsRequest = new sql.Request(transaction)
        .input('id', sql.Int, Number(id))
        .input('status', sql.NVarChar, status)
        .input('reason', sql.NVarChar, reason)
        .input('claim_id', sql.NVarChar, claim_id)
        .input('updated_at', sql.DateTime, now);

    if (paidAmount) {
        claimsUpdateQuery += ', paidAmount = @paidAmount';
        claimsRequest.input('paidAmount', sql.Decimal(18, 2), parseFloat(paidAmount));
    }
     if (final_amount) {
        claimsUpdateQuery += ', final_amount = @final_amount';
        claimsRequest.input('final_amount', sql.Decimal(18, 2), parseFloat(final_amount));
    }
    claimsUpdateQuery += ' WHERE id = @id';
    await claimsRequest.query(claimsUpdateQuery);

    // 2. Fetch the admission_id from the claim we just updated
    const getAdmissionIdRequest = new sql.Request(transaction);
    const admissionIdResult = await getAdmissionIdRequest
        .input('id', sql.Int, Number(id))
        .query('SELECT admission_id FROM claims WHERE id = @id');
        
    const admission_id = admissionIdResult.recordset[0]?.admission_id;

    // 3. Update the corresponding 'preauth_request' table
    if (admission_id) {
      let preAuthUpdateQuery = 'UPDATE preauth_request SET status = @status, updated_at = @updated_at';
      const preAuthRequest = new sql.Request(transaction)
        .input('admission_id', sql.NVarChar, admission_id)
        .input('status', sql.NVarChar, status)
        .input('updated_at', sql.DateTime, now);

      if (claim_id) {
          preAuthUpdateQuery += ', claim_id = @claim_id';
          preAuthRequest.input('claim_id', sql.NVarChar, claim_id);
      }
      
      preAuthUpdateQuery += ' WHERE admission_id = @admission_id';
      await preAuthRequest.query(preAuthUpdateQuery);
    }
    
    await transaction.commit();

  } catch (error) {
      if(transaction) await transaction.rollback();
      console.error("Error updating claim:", error);
      return { message: "Database error while updating claim.", type: 'error' };
  }

  revalidatePath('/dashboard/claims');
  revalidatePath('/dashboard/pre-auths');
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
