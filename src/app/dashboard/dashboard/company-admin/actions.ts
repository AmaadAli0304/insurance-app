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

export type HospitalBusinessStats = {
  hospitalId: string;
  hospitalName: string;
  activePatients: number;
  preAuthApproved: number;
  preAuthPending: number;
  finalAuthSanctioned: number;
  finalAuthPending: number;
};

export async function getHospitalBusinessStats(): Promise<HospitalBusinessStats[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT
        h.id AS hospitalId,
        h.name AS hospitalName,
        (SELECT COUNT(*) FROM admissions a WHERE a.hospital_id = h.id AND a.status = 'Active') as activePatients,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status IN ('Approved', 'Amount Sanctioned', 'Initial Approval Amount')) as preAuthApproved,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Pre auth Sent') as preAuthPending,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Amount Sanctioned') as finalAuthSanctioned,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Discharge sent') as finalAuthPending
      FROM hospitals h
      ORDER BY h.name
    `);

    return result.recordset as HospitalBusinessStats[];
  } catch (error) {
    console.error('Error fetching hospital business stats:', error);
    throw new Error('Failed to fetch hospital business statistics.');
  }
}