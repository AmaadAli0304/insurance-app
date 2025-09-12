
"use server";

import { getDbPool, sql } from '@/lib/db';
import { DateRange } from 'react-day-picker';

export type PatientBilledStat = {
  patientId: number;
  patientName: string;
  patientPhoto: string | null;
  tpaName: string;
  billedAmount: number;
  sanctionedAmount: number;
};

export async function getPatientBilledStatsForAdmin(dateRange?: DateRange, hospitalId?: string | null): Promise<PatientBilledStat[]> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        
        let whereClauses: string[] = [];
        
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

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            WITH PatientClaimSums AS (
                SELECT
                    c.Patient_id,
                    SUM(ISNULL(c.amount, 0)) as totalBilledAmount,
                    SUM(ISNULL(c.paidAmount, 0)) as totalSanctionedAmount,
                    MAX(c.admission_id) as admission_id,
                    MAX(c.tpa_id) as tpa_id
                FROM claims c
                ${whereClause}
                GROUP BY c.Patient_id
            )
            SELECT
                p.id AS patientId,
                p.first_name + ' ' + p.last_name AS patientName,
                p.photo AS patientPhoto,
                COALESCE(t.name, co.name, 'N/A') as tpaName,
                pcs.totalBilledAmount as billedAmount,
                pcs.totalSanctionedAmount as sanctionedAmount
            FROM PatientClaimSums pcs
            JOIN patients p ON pcs.Patient_id = p.id
            LEFT JOIN preauth_request pr ON pcs.admission_id = pr.admission_id
            LEFT JOIN companies co ON pr.company_id = co.id
            LEFT JOIN tpas t ON pcs.tpa_id = t.id
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
                    photoUrl = typeof row.patientPhoto === 'string' && row.patientPhoto.startsWith('http') ? row.patientPhoto : null;
                }
            }
            return { ...row, patientPhoto: photoUrl };
        });

    } catch (error) {
        console.error('Error fetching patient billing stats for admin:', error);
        throw new Error('Failed to fetch patient billing statistics.');
    }
}
