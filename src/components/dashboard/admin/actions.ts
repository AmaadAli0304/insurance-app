

"use server";

import { getDbPool, sql } from '@/lib/db';
import { DateRange } from 'react-day-picker';
import type { TPA, Hospital } from '@/lib/types';

export type PatientBilledStat = {
  patientId: number;
  patientName: string;
  patientPhoto: string | null;
  tpaName: string;
  billedAmount: number;
  sanctionedAmount: number;
};

export async function getPatientBilledStatsForAdmin(dateRange?: DateRange, hospitalId?: string | null, tpaId?: string | null): Promise<PatientBilledStat[]> {
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
            whereClauses.push('c.hospital_id = @hospitalId AND p.hospital_id = @hospitalId');
        }
        
        if (tpaId) {
            request.input('tpaId', sql.Int, Number(tpaId));
            whereClauses.push('c.tpa_id = @tpaId');
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            SELECT
                p.id AS patientId,
                p.first_name + ' ' + p.last_name AS patientName,
                p.photo AS patientPhoto,
                COALESCE(t.name, co.name, 'N/A') as tpaName,
                (
                    SELECT ISNULL(SUM(c_inner.amount), 0)
                    FROM claims c_inner
                    WHERE c_inner.Patient_id = p.id AND c_inner.status = 'Pre auth Sent'
                    ${dateRange?.from ? 'AND c_inner.created_at BETWEEN @dateFrom AND @dateTo' : ''}
                ) as billedAmount,
                (
                    SELECT ISNULL(SUM(c_inner.paidAmount), 0)
                    FROM claims c_inner
                    WHERE c_inner.Patient_id = p.id AND c_inner.status = 'Final Approval'
                    ${dateRange?.from ? 'AND c_inner.created_at BETWEEN @dateFrom AND @dateTo' : ''}
                ) as sanctionedAmount
            FROM patients p
            LEFT JOIN claims c ON p.id = c.Patient_id
            LEFT JOIN preauth_request pr ON c.admission_id = pr.admission_id
            LEFT JOIN companies co ON pr.company_id = co.id
            LEFT JOIN tpas t ON c.tpa_id = t.id
            ${whereClause}
            GROUP BY 
                p.id,
                p.first_name,
                p.last_name,
                p.photo,
                t.name,
                co.name
            ORDER BY
                p.first_name;
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

export type TpaCollectionStat = {
  tpaId: number;
  tpaName: string;
  amount: number;
  received: number;
  deductions: number;
};

export async function getTpaCollectionStats(dateRange?: DateRange): Promise<TpaCollectionStat[]> {
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
                t.id AS tpaId,
                t.name AS tpaName,
                ISNULL(SUM(CASE WHEN c.status = 'Pre auth Sent' THEN c.amount ELSE 0 END), 0) as amount,
                ISNULL(SUM(CASE WHEN c.status = 'Final Approval' THEN c.paidAmount ELSE 0 END), 0) as received,
                (ISNULL(SUM(CASE WHEN c.status = 'Pre auth Sent' THEN c.amount ELSE 0 END), 0) - ISNULL(SUM(CASE WHEN c.status = 'Final Approval' THEN c.paidAmount ELSE 0 END), 0)) as deductions
            FROM tpas t
            LEFT JOIN claims c ON t.id = c.tpa_id ${dateFilter}
            GROUP BY
                t.id,
                t.name
            ORDER BY
                t.name;
        `;
        
        const result = await request.query(query);

        return result.recordset.map(row => ({
            ...row,
        }));
    } catch (error) {
        console.error('Error fetching TPA collection stats:', error);
        throw new Error('Failed to fetch TPA collection statistics.');
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

export type RejectedCase = {
  patientName: string;
  tpaName: string;
  reason: string;
  amount: number;
};

export async function getRejectedCases(dateRange?: DateRange): Promise<RejectedCase[]> {
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
                p.first_name + ' ' + p.last_name AS patientName,
                COALESCE(t.name, 'N/A') as tpaName,
                c.reason,
                c.amount
            FROM claims c
            JOIN patients p ON c.Patient_id = p.id
            LEFT JOIN tpas t ON c.tpa_id = t.id
            WHERE c.status = 'Rejected'
            ${dateRange?.from ? 'AND c.created_at BETWEEN @dateFrom AND @dateTo' : ''}
            ORDER BY c.created_at DESC;
        `;
        
        const result = await request.query(query);
        return result.recordset as RejectedCase[];

    } catch (error) {
        console.error('Error fetching rejected cases:', error);
        throw new Error('Failed to fetch rejected cases.');
    }
}

