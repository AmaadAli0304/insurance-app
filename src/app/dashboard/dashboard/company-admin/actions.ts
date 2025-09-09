'use server';

import { getDbPool, sql } from '@/lib/db';

export async function getCompanyAdminDashboardStats(companyId: string) {
  if (!companyId) {
    throw new Error('Company ID is required.');
  }
  try {
    const pool = await getDbPool();

    // This query now correctly counts the distinct hospitals linked to the company.
    const statsQuery = `
      SELECT 
        (SELECT COUNT(DISTINCT hospital_id) FROM hospital_companies WHERE company_id = @companyId) as totalHospitals;
    `;

    const result = await pool
      .request()
      .input('companyId', sql.NVarChar, companyId)
      .query(statsQuery);

    const stats = result.recordset[0] || { totalHospitals: 0 };

    // Returning other stats as 0 to focus on fixing the hospital count first.
    return {
      totalHospitals: stats.totalHospitals,
      livePatients: 0,
      pendingRequests: 0,
      rejectedRequests: 0,
    };
    
  } catch (error) {
    console.error('Error fetching company admin dashboard stats:', error);
    throw new Error('Failed to load dashboard statistics.');
  }
}
