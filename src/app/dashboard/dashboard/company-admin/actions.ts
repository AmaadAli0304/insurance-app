
'use server';

import { getDbPool, sql } from '@/lib/db';
import { z } from 'zod';
import { DateRange } from 'react-day-picker';

const DateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});
export type DateRangePickerValue = z.infer<typeof DateRangeSchema>;


export async function getCompanyAdminDashboardStats(companyId: string, dateRange?: DateRange) {
  try {
    const pool = await getDbPool();
    
    const preAuthRequest = pool.request();
    const admissionsRequest = pool.request();

    preAuthRequest.input('companyId', sql.NVarChar, companyId);
    admissionsRequest.input('companyId', sql.NVarChar, companyId);
    
    let preAuthDateFilter = '';
    let admissionsDateFilter = '';

    if (dateRange?.from) {
        const toDate = dateRange.to || new Date();
        preAuthRequest.input('dateFrom', sql.DateTime, dateRange.from);
        preAuthRequest.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
        admissionsRequest.input('dateFrom', sql.DateTime, dateRange.from);
        admissionsRequest.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
        
        preAuthDateFilter = 'AND pr.created_at BETWEEN @dateFrom AND @dateTo';
        admissionsDateFilter = 'AND a.created_at BETWEEN @dateFrom AND @dateTo';
    }

    const totalHospitalsQuery = `SELECT COUNT(*) as totalHospitals FROM hospitals`;
    const livePatientsQuery = `SELECT COUNT(*) as livePatients FROM admissions a WHERE a.status = 'Active' ${admissionsDateFilter}`;
    const pendingRequestsQuery = `SELECT COUNT(*) as pendingRequests FROM preauth_request pr WHERE pr.status = 'Pre auth Sent' ${preAuthDateFilter}`;
    const rejectedRequestsQuery = `SELECT COUNT(*) as rejectedRequests FROM preauth_request pr WHERE pr.status = 'Rejected' ${preAuthDateFilter}`;

    const [
      hospitalsResult,
      livePatientsResult,
      pendingRequestsResult,
      rejectedRequestsResult,
    ] = await Promise.all([
      pool.request().query(totalHospitalsQuery),
      admissionsRequest.query(livePatientsQuery),
      preAuthRequest.query(pendingRequestsQuery),
      preAuthRequest.query(rejectedRequestsQuery),
    ]);

    return {
      totalHospitals: hospitalsResult.recordset[0]?.totalHospitals ?? 0,
      livePatients: livePatientsResult.recordset[0]?.livePatients ?? 0,
      pendingRequests: pendingRequestsResult.recordset[0]?.pendingRequests ?? 0,
      rejectedRequests: rejectedRequestsResult.recordset[0]?.rejectedRequests ?? 0,
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
    
    let dateFilterClauses: string[] = [];
    if (dateRange?.from) {
        const toDate = dateRange.to || new Date(); 
        request.input('dateFrom', sql.DateTime, dateRange.from);
        request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
    }

    const getDateFilter = (alias: string) => {
        if (dateRange?.from) {
            return `AND ${alias}.created_at BETWEEN @dateFrom AND @dateTo`;
        }
        return '';
    }

    const query = `
      SELECT
        h.id AS hospitalId,
        h.name AS hospitalName,
        (SELECT COUNT(*) FROM admissions a WHERE a.hospital_id = h.id AND a.status = 'Active' ${getDateFilter('a')}) as activePatients,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Discharge sent' ${getDateFilter('pr')}) as preAuthApproved,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Pre auth Sent' ${getDateFilter('pr')}) as preAuthPending,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Amount Sanctioned' ${getDateFilter('pr')}) as finalAuthSanctioned,
        ISNULL((SELECT SUM(c.amount) FROM claims c WHERE c.hospital_id = h.id AND c.status IN ('Pre auth Sent', 'Enhancement Request') ${getDateFilter('c')}), 0) as billedAmount,
        ISNULL((SELECT SUM(c.amount) FROM claims c WHERE c.hospital_id = h.id AND c.status = 'Final Amount Sanctioned' ${getDateFilter('c')}), 0) as collection
      FROM hospitals h
      ORDER BY h.name
    `;

    const result = await request.query(query);

    return result.recordset as HospitalBusinessStats[];
  } catch (error) {
    console.error('Error fetching hospital business stats:', error);
    throw new Error('Failed to fetch hospital business statistics.');
  }
}

export type PatientBilledStats = {
  patientId: number;
  patientName: string;
  patientPhoto: string | null;
  hospitalName: string;
  billedAmount: number;
};

export async function getPatientBilledStats(dateRange?: DateRange): Promise<PatientBilledStats[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();

        let dateFilter = '';
        if (dateRange?.from) {
            const toDate = dateRange.to || new Date();
            request.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            dateFilter = 'AND c.created_at BETWEEN @dateFrom AND @dateTo';
        }

        const query = `
            SELECT
                c.Patient_id as patientId,
                c.Patient_name as patientName,
                p.photo as patientPhoto,
                h.name as hospitalName,
                SUM(c.amount) as billedAmount
            FROM claims c
            LEFT JOIN patients p ON c.Patient_id = p.id
            LEFT JOIN hospitals h ON c.hospital_id = h.id
            WHERE c.status IN ('Pre auth Sent', 'Enhancement Request')
            ${dateFilter}
            GROUP BY c.Patient_id, c.Patient_name, p.photo, h.name
            HAVING SUM(c.amount) > 0
            ORDER BY billedAmount DESC
        `;
        
        const result = await request.query(query);

        return result.recordset.map(record => {
            let photoUrl = null;
            if (record.patientPhoto) {
                try {
                    const parsedPhoto = JSON.parse(record.patientPhoto);
                    photoUrl = parsedPhoto.url;
                } catch {
                    photoUrl = null;
                }
            }
            return {
                ...record,
                patientPhoto: photoUrl
            };
        }) as PatientBilledStats[];
    } catch (error) {
        console.error('Error fetching patient billed stats:', error);
        throw new Error('Failed to fetch patient billed statistics.');
    }
}
