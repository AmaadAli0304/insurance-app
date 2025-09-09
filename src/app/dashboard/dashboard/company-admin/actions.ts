'use server';

import { getDbPool, sql } from '@/lib/db';

export async function getCompanyAdminDashboardStats(companyId: string) {
  if (!companyId) {
    throw new Error('Company ID is required.');
  }
  try {
    const pool = await getDbPool();

    // Correctly and simply count all hospitals from the hospitals table, and live patients from admissions.
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM hospitals) as totalHospitals,
        (SELECT COUNT(*) FROM admissions WHERE status = 'Active') as livePatients;
    `;

    const result = await pool
      .request()
      .input('companyId', sql.NVarChar, companyId)
      .query(statsQuery);

    const stats = result.recordset[0] || { totalHospitals: 0, livePatients: 0 };

    // Returning other stats as 0 for now.
    return {
      totalHospitals: stats.totalHospitals,
      livePatients: stats.livePatients,
      pendingRequests: 0,
      rejectedRequests: 0,
    };
    
  } catch (error) {
    console.error('Error fetching company admin dashboard stats:', error);
    throw new Error('Failed to load dashboard statistics.');
  }
}
