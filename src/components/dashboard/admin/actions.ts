
'use server';

import { getDbPool, sql } from '@/lib/db';
import { DateRange } from 'react-day-picker';

export async function getAdminDashboardStats(dateRange?: DateRange) {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        
        let dateFilter = '';
        if (dateRange?.from) {
            const toDate = dateRange.to || new Date();
            request.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            dateFilter = 'WHERE joiningDate BETWEEN @dateFrom AND @dateTo';
        }

        const statsQuery = `
            SELECT
                (SELECT COUNT(*) FROM hospitals) as totalHospitals,
                (SELECT COUNT(*) FROM companies) as totalCompanies,
                (SELECT COUNT(*) FROM users WHERE role = 'Hospital Staff' ${dateFilter.replace('joiningDate', 'u.joiningDate')}) as totalStaff
        `;
        
        const result = await request.query(statsQuery);
        
        return {
            totalHospitals: result.recordset[0]?.totalHospitals ?? 0,
            totalCompanies: result.recordset[0]?.totalCompanies ?? 0,
            totalStaff: result.recordset[0]?.totalStaff ?? 0,
        };
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        throw new Error('Failed to load dashboard statistics.');
    }
}

export type ActivePatientStat = {
  patientName: string;
  admissionId: string;
  tpaName: string;
  amountRequested: number;
  amountSanctioned: number;
  status: string;
};

export async function getActivePatients(dateRange?: DateRange): Promise<ActivePatientStat[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();

        let dateFilter = '';
        if (dateRange?.from) {
            const toDate = dateRange.to || new Date();
            request.input('dateFrom', sql.DateTime, dateRange.from);
            request.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            dateFilter = 'AND a.created_at BETWEEN @dateFrom AND @dateTo';
        }
        
        const query = `
            SELECT 
                p.first_name + ' ' + p.last_name as patientName,
                a.admission_id as admissionId,
                t.name as tpaName,
                a.totalExpectedCost as amountRequested,
                a.amount_sanctioned as amountSanctioned,
                a.status
            FROM preauth_request a
            JOIN patients p ON a.patient_id = p.id
            LEFT JOIN tpas t ON a.tpa_id = t.id
            WHERE a.status NOT IN ('Settlement Done', 'Rejected', 'Final Amount Sanctioned')
            ${dateFilter}
            ORDER BY a.created_at DESC
        `;

        const result = await request.query(query);
        return result.recordset as ActivePatientStat[];

    } catch (error) {
        console.error('Error fetching active patients:', error);
        throw new Error('Failed to fetch active patient statistics.');
    }
}
