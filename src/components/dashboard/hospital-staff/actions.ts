
'use server';

import { getDbPool, sql } from '@/lib/db';
import type { StaffingRequest } from '@/lib/types';

export interface DashboardStats {
    livePatients: number;
    pendingRequests: number;
    totalRequests: number;
    slaBreaches: number;
}

export interface PendingPreAuth extends StaffingRequest {
    patientName: string;
    tpaOrInsurerName: string;
    amountRequested: number;
}

export interface DashboardData {
    stats: DashboardStats;
    pendingPreAuths: PendingPreAuth[];
    queryRaisedPreAuths: PendingPreAuth[];
}

export async function getDashboardData(hospitalId: string): Promise<DashboardData> {
    if (!hospitalId) {
        throw new Error("Hospital ID is required to fetch dashboard data.");
    }

    try {
        const pool = await getDbPool();

        // Stats queries
        const livePatientsQuery = pool.request()
            .input('hospitalId', sql.NVarChar, hospitalId)
            .query("SELECT COUNT(*) as count FROM admissions WHERE hospital_id = @hospitalId AND status = 'Active'");
            
        const requestsQuery = pool.request()
            .input('hospitalId', sql.NVarChar, hospitalId)
            .query("SELECT status FROM preauth_request WHERE hospital_id = @hospitalId");

        // Pending Pre-Auths query
        const pendingPreAuthsQuery = pool.request()
            .input('hospitalId', sql.NVarChar, hospitalId)
            .query(`
                SELECT 
                    pr.id,
                    pr.patient_id as patientId,
                    p.first_name + ' ' + p.last_name as patientName,
                    COALESCE(tpa.name, comp.name, 'N/A') as tpaOrInsurerName,
                    pr.totalExpectedCost as amountRequested
                FROM preauth_request pr
                JOIN patients p ON pr.patient_id = p.id
                LEFT JOIN companies comp ON pr.company_id = comp.id
                LEFT JOIN tpas tpa ON pr.tpa_id = tpa.id
                WHERE pr.hospital_id = @hospitalId AND pr.status = 'Pre auth Sent'
                ORDER BY pr.created_at DESC
            `);
        
        // Query Raised Pre-Auths query
        const queryRaisedPreAuthsQuery = pool.request()
            .input('hospitalId', sql.NVarChar, hospitalId)
            .query(`
                SELECT 
                    pr.id,
                    pr.patient_id as patientId,
                    p.first_name + ' ' + p.last_name as patientName,
                    COALESCE(tpa.name, comp.name, 'N/A') as tpaOrInsurerName,
                    pr.totalExpectedCost as amountRequested
                FROM preauth_request pr
                JOIN patients p ON pr.patient_id = p.id
                LEFT JOIN companies comp ON pr.company_id = comp.id
                LEFT JOIN tpas tpa ON pr.tpa_id = tpa.id
                WHERE pr.hospital_id = @hospitalId AND pr.status = 'Query Raised'
                ORDER BY pr.created_at DESC
            `);

        const [livePatientsResult, requestsResult, pendingPreAuthsResult, queryRaisedResult] = await Promise.all([
            livePatientsQuery,
            requestsQuery,
            pendingPreAuthsQuery,
            queryRaisedPreAuthsQuery
        ]);

        const stats: DashboardStats = {
            livePatients: livePatientsResult.recordset[0]?.count ?? 0,
            totalRequests: requestsResult.recordset.length,
            pendingRequests: requestsResult.recordset.filter(r => r.status === 'Pre auth Sent').length,
            slaBreaches: requestsResult.recordset.filter(r => r.status === 'Rejected').length,
        };

        return {
            stats,
            pendingPreAuths: pendingPreAuthsResult.recordset as PendingPreAuth[],
            queryRaisedPreAuths: queryRaisedResult.recordset as PendingPreAuth[],
        };

    } catch (error) {
        console.error("Error fetching hospital staff dashboard data:", error);
        throw new Error("Failed to load dashboard data from the database.");
    }
}
