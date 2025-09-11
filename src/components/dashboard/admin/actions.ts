
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

        const whereClause = staffWhereClauses.length > 0 ? `WHERE ${staffWhereClauses.join(' AND ')}` : '';

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

export type PatientBilledStat = {
  patientId: number;
  patientName: string;
  patientPhoto: string | null;
  hospitalName: string;
  tpaName: string;
  billedAmount: number;
};

export async function getPatientBilledStatsForAdmin(dateRange?: DateRange): Promise<PatientBilledStat[]> {
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
                p.id AS patientId,
                p.first_name + ' ' + p.last_name AS patientName,
                p.photo AS patientPhoto,
                h.name AS hospitalName,
                COALESCE(t.name, co.name, 'N/A') as tpaName,
                SUM(c.amount) as billedAmount
            FROM claims c
            JOIN patients p ON c.Patient_id = p.id
            JOIN hospitals h ON c.hospital_id = h.id
            JOIN preauth_request pr ON c.admission_id = pr.admission_id
            LEFT JOIN companies co ON pr.company_id = co.id
            LEFT JOIN tpas t ON c.tpa_id = t.id
            WHERE c.status IN ('Pre auth Sent', 'Enhancement Request') ${dateFilter}
            GROUP BY
                p.id,
                p.first_name,
                p.last_name,
                p.photo,
                h.name,
                co.name,
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
        console.error('Error fetching patient billing stats for admin:', error);
        throw new Error('Failed to fetch patient billing statistics.');
    }
}
