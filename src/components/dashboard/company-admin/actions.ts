

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
    const livePatientsQuery = `SELECT COUNT(*) as livePatients FROM admissions a WHERE a.status = 'Active'`;
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
        (SELECT COUNT(*) FROM admissions a WHERE a.hospital_id = h.id AND a.status = 'Active') as activePatients,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Discharge sent' ${getDateFilter('pr')}) as preAuthApproved,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Pre auth Sent' ${getDateFilter('pr')}) as preAuthPending,
        (SELECT COUNT(*) FROM preauth_request pr WHERE pr.hospital_id = h.id AND pr.status = 'Final Approval' ${getDateFilter('pr')}) as finalAuthSanctioned,
        ISNULL((SELECT SUM(c.amount) FROM claims c WHERE c.hospital_id = h.id AND c.status IN ('Pre auth Sent', 'Enhancement Request') ${getDateFilter('c')}), 0) as billedAmount,
        ISNULL((SELECT SUM(c.amount) FROM claims c WHERE c.hospital_id = h.id AND c.status = 'Final Approval' ${getDateFilter('c')}), 0) as collection
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

export async function getPatientBilledStats(
    dateRange?: DateRange, 
    hospitalId?: string | null, 
    tpaId?: string | null,
    page: number = 1,
    limit: number = 10
): Promise<{ stats: PatientBilledStat[], total: number }> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const countRequest = pool.request();

        let whereClauses: string[] = [`c.status IN ('Pre auth Sent', 'Enhancement Request')`];

        if (dateRange?.from) {
            const toDate = dateRange.to || new Date();
            request.input('dateFrom', sql.DateTime, dateRange.from);
            countRequest.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            countRequest.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            whereClauses.push('c.created_at BETWEEN @dateFrom AND @dateTo');
        }

        if (hospitalId) {
            request.input('hospitalId', sql.NVarChar, hospitalId);
            countRequest.input('hospitalId', sql.NVarChar, hospitalId);
            whereClauses.push('c.hospital_id = @hospitalId');
        }

        if (tpaId) {
            request.input('tpaId', sql.Int, Number(tpaId));
            countRequest.input('tpaId', sql.Int, Number(tpaId));
            whereClauses.push('c.tpa_id = @tpaId');
        }
        
        const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

        const countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM claims c
            JOIN patients p ON c.Patient_id = p.id
            ${whereClause};
        `;
        const totalResult = await countRequest.query(countQuery);
        const total = totalResult.recordset[0].total;

        const offset = (page - 1) * limit;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const dataQuery = `
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
                billedAmount DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
        `;

        const result = await request.query(dataQuery);
        
        const stats = result.recordset.map(row => {
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

        return { stats, total };

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
  staffPhoto: string | null;
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
            dateFilter = `AND c.created_at BETWEEN @dateFrom AND @dateTo`;
        }

        const query = `
            WITH HospitalAssignments AS (
                SELECT 
                    staff_id,
                    STRING_AGG(h.name, ', ') AS hospitalName
                FROM 
                    hospital_staff hs
                JOIN 
                    hospitals h ON hs.hospital_id = h.id
                GROUP BY 
                    staff_id
            )
            SELECT 
                u.uid AS staffId,
                u.name AS staffName,
                u.photo as staffPhoto,
                ISNULL(ha.hospitalName, 'N/A') AS hospitalName,
                ISNULL(COUNT(DISTINCT c.id), 0) AS numOfCases,
                ISNULL(SUM(c.paidAmount), 0) AS totalCollection
            FROM 
                users u
            LEFT JOIN 
                claims c ON u.uid = c.created_by AND c.status = 'Final Approval' ${dateFilter}
            LEFT JOIN 
                HospitalAssignments ha ON u.uid = ha.staff_id
            WHERE 
                u.role = 'Hospital Staff'
            GROUP BY 
                u.uid, u.name, u.photo, ha.hospitalName
            ORDER BY
                totalCollection DESC;
        `;
        
        const result = await request.query(query);
        return result.recordset.map(row => {
            let photoUrl = null;
            if (row.staffPhoto) {
                try {
                    const parsed = JSON.parse(row.staffPhoto);
                    photoUrl = parsed.url;
                } catch {
                     if (typeof row.staffPhoto === 'string' && row.staffPhoto.startsWith('http')) {
                        photoUrl = row.staffPhoto;
                    }
                }
            }
            return { ...row, staffPhoto: photoUrl };
        });

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

export type StaffOnDutyStat = {
    staffId: string;
    staffName: string;
    hospitalName: string;
    preAuthCount: number;
    finalApprovalCount: number;
    dischargeCount: number;
    rejectionCount: number;
};

export async function getStaffOnDutyStats(): Promise<StaffOnDutyStat[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        request.input('today', sql.Date, today);
        request.input('tomorrow', sql.Date, tomorrow);

        const query = `
            WITH PresentStaff AS (
                SELECT staff_id
                FROM attendance
                WHERE date >= @today AND date < @tomorrow AND status = 'present'
            ),
            PreAuthCounts AS (
                SELECT
                    staff_id,
                    COUNT(*) as preAuthCount
                FROM preauth_request
                WHERE status = 'Pre auth Sent' AND created_at >= @today AND created_at < @tomorrow
                GROUP BY staff_id
            ),
            ClaimCounts AS (
                SELECT
                    created_by,
                    SUM(CASE WHEN status = 'Final Approval' THEN 1 ELSE 0 END) as finalApprovalCount,
                    SUM(CASE WHEN status = 'Final Discharge sent' THEN 1 ELSE 0 END) as dischargeCount,
                    SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejectionCount
                FROM claims
                WHERE created_at >= @today AND created_at < @tomorrow
                GROUP BY created_by
            )
            SELECT
                ps.staff_id as staffId,
                u.name as staffName,
                h.name as hospitalName,
                ISNULL(pa.preAuthCount, 0) as preAuthCount,
                ISNULL(cc.finalApprovalCount, 0) as finalApprovalCount,
                ISNULL(cc.dischargeCount, 0) as dischargeCount,
                ISNULL(cc.rejectionCount, 0) as rejectionCount
            FROM PresentStaff ps
            JOIN users u ON ps.staff_id = u.uid
            LEFT JOIN hospital_staff hs ON u.uid = hs.staff_id
            LEFT JOIN hospitals h ON hs.hospital_id = h.id
            LEFT JOIN PreAuthCounts pa ON ps.staff_id = pa.staff_id
            LEFT JOIN ClaimCounts cc ON ps.staff_id = cc.created_by
            ORDER BY u.name;
        `;
        
        const result = await request.query(query);
        return result.recordset as StaffOnDutyStat[];

    } catch (error) {
        console.error('Error fetching staff on duty stats:', error);
        throw new Error('Failed to fetch staff on duty statistics.');
    }
}

export type StaffSalaryStat = {
  hospitalName: string;
  invoiceAmount: number;
  invoiceNo: string;
  status: string;
  amountReceived: number;
  tds: number;
  gst: number;
};

export async function getStaffSalaryStats(dateRange?: DateRange): Promise<StaffSalaryStat[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        
        let dateFilter = '';
        if (dateRange?.from) {
            const toDate = dateRange.to || new Date(); 
            request.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            dateFilter = 'WHERE ss.created_at BETWEEN @dateFrom AND @dateTo';
        }

        const query = `
            SELECT
                h.name as hospitalName,
                ss.invoice_amount as invoiceAmount,
                ss.invoice_no as invoiceNo,
                ss.status,
                ss.amount_received as amountReceived,
                ss.tds,
                ss.gst
            FROM staff_salary ss
            JOIN hospitals h ON ss.hospital_id = h.id
            ${dateFilter}
            ORDER BY h.name, ss.created_at DESC;
        `;
        
        const result = await request.query(query);
        return result.recordset as StaffSalaryStat[];

    } catch (error) {
        console.error('Error fetching staff salary stats:', error);
        throw new Error('Failed to fetch staff salary statistics.');
    }
}
    
export type FinalApprovalStat = {
  patientName: string;
  tpaName: string;
  final_bill: number;
  hospital_discount: number;
  nm_deductions: number;
  co_pay: number;
  finalAuthorisedAmount: number;
};

export async function getFinalApprovalStats(dateRange?: DateRange): Promise<FinalApprovalStat[]> {
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
                c.Patient_name as patientName,
                t.name as tpaName,
                c.final_bill,
                c.hospital_discount,
                c.nm_deductions,
                c.co_pay,
                c.paidAmount as finalAuthorisedAmount
            FROM claims c
            LEFT JOIN tpas t ON c.tpa_id = t.id
            WHERE c.status = 'Final Approval' ${dateFilter}
            ORDER BY c.created_at DESC;
        `;
        
        const result = await request.query(query);
        return result.recordset as FinalApprovalStat[];

    } catch (error) {
        console.error('Error fetching final approval stats:', error);
        throw new Error('Failed to fetch final approval statistics.');
    }
}
