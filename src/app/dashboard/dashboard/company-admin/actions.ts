'use server';

import { getDbPool, sql } from '@/lib/db';
import { z } from 'zod';

const DateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});
export type DateRange = z.infer<typeof DateRangeSchema>;


export async function getCompanyAdminDashboardStats(companyId: string, dateRange?: DateRange) {
  try {
    const pool = await getDbPool();
    const request = pool.request().input('companyId', sql.NVarChar, companyId);
    
    let dateFilter = '';
    if (dateRange?.from && dateRange?.to) {
        dateFilter = 'AND created_at BETWEEN @dateFrom AND @dateTo';
        request.input('dateFrom', sql.DateTime, dateRange.from);
        request.input('dateTo', sql.DateTime, dateRange.to);
    }

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM hospitals) as totalHospitals,
        (SELECT COUNT(*) FROM admissions WHERE status = 'Active' ${dateFilter.replace('created_at', 'created_at')}) as livePatients,
        (SELECT COUNT(*) FROM preauth_request WHERE status = 'Pre auth Sent' ${dateFilter}) as pendingRequests,
        (SELECT COUNT(*) FROM preauth_request WHERE status = 'Rejected' ${dateFilter}) as rejectedRequests;
    `;

    const result = await request.query(statsQuery);

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
  billedAmount: number;
  collection: number;
};

export async function getHospitalBusinessStats(dateRange?: DateRange): Promise<HospitalBusinessStats[]> {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    
    let dateFilterAdmissions = '';
    let dateFilterPreAuth = '';
    let dateFilterClaims = '';

    if (dateRange?.from && dateRange?.to) {
        request.input('dateFrom', sql.DateTime, dateRange.from);
        request.input('dateTo', sql.DateTime, dateRange.to);
        dateFilterAdmissions = 'AND a.created_at BETWEEN @dateFrom AND @dateTo';
        dateFilterPreAuth = 'AND pr.created_at BETWEEN @dateFrom AND @dateTo';
        dateFilterClaims = 'AND c.created_at BETWEEN @dateFrom AND @dateTo';
    }


    const result = await pool.request().query(`
      SELECT
        h.id AS hospitalId,
        h.name AS hospitalName,
        (SELECT COUNT(*) FROM admissions a WHERE a.hospital_id = h.id AND a.status = 'Active' ${dateFilterAdmissions}) as activePatients,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Discharge sent' ${dateFilterPreAuth}) as preAuthApproved,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Pre auth Sent' ${dateFilterPreAuth}) as preAuthPending,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Amount Sanctioned' ${dateFilterPreAuth}) as finalAuthSanctioned,
        ISNULL((SELECT SUM(c.amount) FROM claims c WHERE c.hospital_id = h.id AND c.status IN ('Pre auth Sent', 'Enhancement Request') ${dateFilterClaims}), 0) as billedAmount,
        ISNULL((SELECT SUM(c.amount) FROM claims c WHERE c.hospital_id = h.id AND c.status = 'Final Amount Sanctioned' ${dateFilterClaims}), 0) as collection
      FROM hospitals h
      ORDER BY h.name
    `);

    return result.recordset as HospitalBusinessStats[];
  } catch (error) {
    console.error('Error fetching hospital business stats:', error);
    throw new Error('Failed to fetch hospital business statistics.');
  }
}
