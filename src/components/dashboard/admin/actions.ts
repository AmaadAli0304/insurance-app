
"use server";

import { getDbPool, sql } from '@/lib/db';
import { DateRange } from 'react-day-picker';

export async function getAdminDashboardStats(dateRange?: DateRange) {
    try {
        const pool = await getDbPool();
        
        const staffRequest = pool.request();
        let staffWhereClauses: string[] = ["role = 'Hospital Staff'"];

        if (dateRange?.from) {
            const toDate = dateRange.to || new Date();
            staffRequest.input('dateFrom', sql.DateTime, dateRange.from);
            staffRequest.input('dateTo', sql.DateTime, new Date(toDate.setHours(23, 59, 59, 999)));
            staffWhereClauses.push('joiningDate BETWEEN @dateFrom AND @dateTo');
        }

        const whereClause = `WHERE ${staffWhereClauses.join(' AND ')}`;

        const totalHospitalsQuery = `SELECT COUNT(*) as totalHospitals FROM hospitals`;
        const totalCompaniesQuery = `SELECT COUNT(*) as totalCompanies FROM companies`;
        const totalStaffQuery = `SELECT COUNT(*) as totalStaff FROM users ${whereClause}`;

        const [
            hospitalsResult,
            companiesResult,
            staffResult,
        ] = await Promise.all([
            pool.request().query(totalHospitalsQuery),
            pool.request().query(totalCompaniesQuery),
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
            dateFilter = 'WHERE pr.created_at BETWEEN @dateFrom AND @dateTo';
        }
        
        const query = `
            SELECT 
                pr.first_name + ' ' + pr.last_name as patientName,
                pr.admission_id as admissionId,
                COALESCE(t.name, co.name, 'N/A') as tpaName,
                pr.totalExpectedCost as amountRequested,
                pr.amount_sanctioned as amountSanctioned,
                pr.status
            FROM preauth_request pr
            LEFT JOIN companies co ON pr.company_id = co.id
            LEFT JOIN tpas t ON pr.tpa_id = t.id
            ${dateFilter}
            ORDER BY pr.created_at DESC
        `;

        const result = await request.query(query);
        return result.recordset as ActivePatientStat[];

    } catch (error) {
        console.error('Error fetching active patients:', error);
        throw new Error('Failed to fetch active patient statistics.');
    }
}
