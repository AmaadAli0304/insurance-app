
"use server";

import { getDbPool, sql } from '@/lib/db';
import { DateRange } from 'react-day-picker';

export type PatientBilledStat = {
  patientId: number;
  patientName: string;
  patientPhoto: string | null;
  hospitalName: string;
  tpaName: string;
  billedAmount: number;
  sanctionedAmount: number;
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
            dateFilter = 'WHERE c.created_at BETWEEN @dateFrom AND @dateTo';
        }

        const query = `
            SELECT
                p.id AS patientId,
                p.first_name + ' ' + p.last_name AS patientName,
                p.photo AS patientPhoto,
                h.name AS hospitalName,
                COALESCE(t.name, co.name, 'N/A') as tpaName,
                ISNULL(SUM(CASE WHEN c.status IN ('Pre auth Sent', 'Enhancement Request') THEN c.amount ELSE 0 END), 0) as billedAmount,
                ISNULL(SUM(CASE WHEN c.status IN ('Amount Sanctioned', 'Final Amount Sanctioned', 'Amount Received', 'Settlement Done', 'Paid') THEN c.paidAmount ELSE 0 END), 0) as sanctionedAmount
            FROM claims c
            JOIN patients p ON c.Patient_id = p.id
            JOIN hospitals h ON c.hospital_id = h.id
            JOIN preauth_request pr ON c.admission_id = pr.admission_id
            LEFT JOIN companies co ON pr.company_id = co.id
            LEFT JOIN tpas t ON c.tpa_id = t.id
            ${dateFilter}
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
