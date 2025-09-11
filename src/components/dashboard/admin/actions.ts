
"use server";

import { getDbPool, sql } from '@/lib/db';
import { DateRange } from 'react-day-picker';

export async function getAdminDashboardStats(dateRange?: DateRange) {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        
        const staffRequest = pool.request();
        let staffWhereClauses: string[] = ["role = 'Hospital Staff'"];

        if (dateRange?.from) {
            const toDate = dateRange.to || new Date();
            staffRequest.input('dateFrom', sql.DateTime, dateRange.from);
            staffRequest.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            staffWhereClauses.push('joiningDate BETWEEN @dateFrom AND @dateTo');
        }

        const totalHospitalsQuery = `SELECT COUNT(*) as totalHospitals FROM hospitals`;
        const totalCompaniesQuery = `SELECT COUNT(*) as totalCompanies FROM companies`;
        const totalStaffQuery = `SELECT COUNT(*) as totalStaff FROM users WHERE ${staffWhereClauses.join(' AND ')}`;

        const [
            hospitalsResult,
            companiesResult,
            staffResult,
        ] = await Promise.all([
            request.query(totalHospitalsQuery),
            request.query(totalCompaniesQuery),
            staffRequest.query(totalStaffQuery)
        ]);
        
        return {
            totalHospitals: hospitalsResult.recordset[0]?.totalHospitals ?? 0,
            totalCompanies: companiesResult.recordset[0]?.totalCompanies ?? 0,
            totalStaff: staffResult.recordset[0]?.totalStaff ?? 0,
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
                COALESCE(t.name, co.name, 'N/A') as tpaName,
                a.totalExpectedCost as amountRequested,
                a.amount_sanctioned as amountSanctioned,
                a.status
            FROM preauth_request a
            JOIN patients p ON a.patient_id = p.id
            LEFT JOIN companies co ON a.company_id = co.id
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
