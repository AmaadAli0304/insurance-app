'use server';

import { getDbPool, sql } from '@/lib/db';

export async function getCompanyAdminDashboardStats(companyId: string) {
  if (!companyId) {
    throw new Error('Company ID is required.');
  }
  try {
    const pool = await getDbPool();

    const statsQuery = `
      SELECT 
        (SELECT COUNT(DISTINCT hospital_id) FROM hospital_companies WHERE company_id = @companyId) as totalHospitals,
        (SELECT COUNT(id) FROM preauth_request WHERE company_id = @companyId AND status = 'Pending') as pendingRequests,
        (SELECT COUNT(id) FROM preauth_request WHERE company_id = @companyId AND status = 'Rejected') as rejectedRequests,
        (
          SELECT COUNT(DISTINCT p.id)
          FROM patients p
          JOIN preauth_request pr ON p.id = pr.patient_id
          WHERE pr.company_id = @companyId
          AND pr.status NOT IN ('Settlement Done', 'Rejected', 'Final Amount Sanctioned', 'Amount received') 
        ) as livePatients;
    `;

    const result = await pool
      .request()
      .input('companyId', sql.NVarChar, companyId)
      .query(statsQuery);

    if (result.recordset.length === 0) {
      return {
        totalHospitals: 0,
        livePatients: 0,
        pendingRequests: 0,
        rejectedRequests: 0,
      };
    }

    return result.recordset[0];
  } catch (error) {
    console.error('Error fetching company admin dashboard stats:', error);
    throw new Error('Failed to load dashboard statistics.');
  }
}
