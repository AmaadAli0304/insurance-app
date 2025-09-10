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
        (SELECT COUNT(*) FROM hospitals) as totalHospitals,
        (SELECT COUNT(*) FROM admissions WHERE status = 'Active') as livePatients,
        (SELECT COUNT(*) FROM preauth_request WHERE status = 'Pre auth Sent') as pendingRequests,
        (SELECT COUNT(*) FROM preauth_request WHERE status = 'Rejected') as rejectedRequests;
    `;

    const result = await pool
      .request()
      .input('companyId', sql.NVarChar, companyId)
      .query(statsQuery);

    const stats = result.recordset[0] || { totalHospitals: 0, livePatients: 0, pendingRequests: 0, rejectedRequests: 0 };

    return {
      totalHospitals: stats.totalHospitals,
      livePatients: stats.livePatients,
      pendingRequests: stats.pendingRequests,
      rejectedRequests: stats.rejectedRequests,
    };
    
  } catch (error) {
    console.error('Error fetching company admin dashboard stats:', error);
    throw new Error('Failed to load dashboard statistics.');
  }
}
