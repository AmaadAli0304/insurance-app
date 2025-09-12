

'use server';

import { getDbPool, sql } from '@/lib/db';
import { z } from 'zod';
import { DateRange } from 'react-day-picker';
import { TPA, Hospital } from '@/lib/types';


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
      preAuthRequest.query(pendingRequestsQuery), // Corrected to use preAuthRequest
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

    const getDateFilter = (alias: string, column: string = 'created_at') => {
        if (dateRange?.from) {
            return `AND ${alias}.${column} BETWEEN @dateFrom AND @dateTo`;
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

export type PatientBilledStat = {
  patientId: number;
  patientName: string;
  patientPhoto: string | null;
  hospitalName: string;
  tpaName: string;
  billedAmount: number;
};

export async function getPatientBilledStats(dateRange?: DateRange, hospitalId?: string | null, tpaId?: string | null): Promise<PatientBilledStat[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();

        let whereClauses: string[] = [`c.status IN ('Pre auth Sent', 'Enhancement Request')`];

        if (dateRange?.from) {
            const toDate = dateRange.to || new Date();
            request.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            whereClauses.push('c.created_at BETWEEN @dateFrom AND @dateTo');
        }

        if (hospitalId) {
            request.input('hospitalId', sql.NVarChar, hospitalId);
            whereClauses.push('c.hospital_id = @hospitalId');
        }

        if (tpaId) {
            request.input('tpaId', sql.Int, Number(tpaId));
            whereClauses.push('c.tpa_id = @tpaId');
        }
        
        const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

        const query = `
            SELECT
                p.id AS patientId,
                p.first_name + ' ' + p.last_name AS patientName,
                p.photo AS patientPhoto,
                h.name AS hospitalName,
                t.name AS tpaName,
                SUM(c.amount) as billedAmount
            FROM claims c
            JOIN patients p ON c.Patient_id = p.id
            JOIN hospitals h ON c.hospital_id = h.id
            JOIN tpas t ON c.tpa_id = t.id
            ${whereClause}
            GROUP BY
                p.id,
                p.first_name,
                p.last_name,
                p.photo,
                h.name,
                t.name
            ORDER BY
                billedAmount DESC;
        `;

        const result = await request.query(query);
        
        return result.recordset.map(row => {
            let photoUrl = null;
            if (row.patientPhoto) {
                try {
                    const parsed = JSON.parse(row.patientPhoto);
                    photoUrl = parsed.url;
                } catch {
                    photoUrl = null;
                }
            }
            return { ...row, patientPhoto: photoUrl };
        });

    } catch (error) {
        console.error('Error fetching patient billing stats:', error);
        throw new Error('Failed to fetch patient billing statistics.');
    }
}

export type SimpleHospitalStat = {
  hospitalId: string;
  hospitalName: string;
  numOfPatients: number;
  amount: number;
};

export async function getSimpleHospitalBusinessStats(dateRange?: DateRange): Promise<SimpleHospitalStat[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        
        let dateFilter = '';
        if (dateRange?.from) {
            const toDate = dateRange.to || new Date(); 
            request.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            dateFilter = 'WHERE c.created_at BETWEEN @dateFrom AND @dateTo';
        }

        const query = `
            SELECT
                h.id as hospitalId,
                h.name as hospitalName,
                COUNT(DISTINCT c.Patient_id) as numOfPatients,
                ISNULL(SUM(CASE WHEN c.status IN ('Pre auth Sent', 'Enhancement Request') THEN c.amount ELSE 0 END), 0) as amount
            FROM hospitals h
            LEFT JOIN claims c ON h.id = c.hospital_id ${dateFilter}
            GROUP BY h.id, h.name
            ORDER BY h.name;
        `;
        
        const result = await request.query(query);
        return result.recordset as SimpleHospitalStat[];
    } catch (error) {
        console.error('Error fetching simple hospital business stats:', error);
        throw new Error('Failed to fetch simplified hospital statistics.');
    }
}

export type StaffPerformanceStat = {
  staffId: string;
  staffName: string;
  hospitalName: string;
  numOfCases: number;
  totalCollection: number;
};

export async function getStaffPerformanceStats(dateRange?: DateRange): Promise<StaffPerformanceStat[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        
        let dateFilter = '';
        if (dateRange?.from) {
            const toDate = dateRange.to || new Date(); 
            request.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            dateFilter = 'AND pr.created_at BETWEEN @dateFrom AND @dateTo';
        }

        const query = `
            WITH StaffCollections AS (
              SELECT
                pr.staff_id,
                SUM(ISNULL(c.amount, 0)) AS totalCollection
              FROM claims c
              JOIN preauth_request pr ON c.admission_id = pr.admission_id
              WHERE c.status = 'Final Amount Sanctioned' ${dateFilter}
              GROUP BY pr.staff_id
            )
            SELECT
                u.uid AS staffId,
                u.name AS staffName,
                ISNULL(h.name, 'N/A') AS hospitalName,
                (
                    SELECT COUNT(DISTINCT pr_inner.id) 
                    FROM preauth_request pr_inner 
                    WHERE pr_inner.staff_id = u.uid 
                    ${dateFilter.replace('pr.created_at', 'pr_inner.created_at')}
                ) AS numOfCases,
                ISNULL(scc.totalCollection, 0) AS totalCollection
            FROM users u
            LEFT JOIN hospital_staff hs ON u.uid = hs.staff_id
            LEFT JOIN hospitals h ON hs.hospital_id = h.id
            LEFT JOIN StaffCollections scc ON u.uid = scc.staff_id
            WHERE u.role = 'Hospital Staff'
            ORDER BY u.name;
        `;
        
        const result = await request.query(query);
        return result.recordset as StaffPerformanceStat[];
    } catch (error) {
        console.error('Error fetching staff performance stats:', error);
        throw new Error('Failed to fetch staff performance statistics.');
    }
}

export async function getTpaList(): Promise<Pick<TPA, 'id' | 'name'>[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query('SELECT id, name FROM tpas');
    return result.recordset as Pick<TPA, 'id' | 'name'>[];
  } catch (error) {
    console.error('Error fetching TPAs:', error);
    throw new Error('Failed to fetch TPA list.');
  }
}

export async function getHospitalList(): Promise<Pick<Hospital, 'id' | 'name'>[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query('SELECT id, name FROM hospitals');
    return result.recordset as Pick<Hospital, 'id' | 'name'>[];
  } catch (error) {
    console.error('Error fetching Hospitals:', error);
    throw new Error('Failed to fetch hospital list.');
  }
}
