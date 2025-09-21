
'use server';

import { getDbPool, sql } from '@/lib/db';

export type ActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_PATIENT'
  | 'UPDATE_PATIENT'
  | 'DELETE_PATIENT'
  | 'CREATE_PREAUTH'
  | 'UPDATE_PREAUTH_STATUS'
  | 'DELETE_PREAUTH'
  | 'CREATE_CLAIM'
  | 'UPDATE_CLAIM'
  | 'DELETE_CLAIM'
  | 'CREATE_COMPANY'
  | 'UPDATE_COMPANY'
  | 'DELETE_COMPANY'
  | 'CREATE_HOSPITAL'
  | 'UPDATE_HOSPITAL'
  | 'DELETE_HOSPITAL'
  | 'CREATE_TPA'
  | 'UPDATE_TPA'
  | 'DELETE_TPA'
  | 'CREATE_DOCTOR'
  | 'UPDATE_DOCTOR'
  | 'DELETE_DOCTOR'
  | 'CREATE_STAFF'
  | 'UPDATE_STAFF'
  | 'DELETE_STAFF'
  | 'CREATE_INVOICE'
  | 'UPDATE_INVOICE'
  | 'DELETE_INVOICE'
  | 'SAVE_ATTENDANCE';

export interface LogActivityParams {
  userId: string;
  userName: string;
  actionType: ActionType;
  details: string;
  targetId?: string | number;
  targetType?: 'Patient' | 'Claim' | 'PreAuth' | 'Company' | 'Hospital' | 'TPA' | 'Doctor' | 'Staff' | 'Invoice' | 'Attendance';
}

export async function logActivity({ userId, userName, actionType, details, targetId, targetType }: LogActivityParams) {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    await request
      .input('user_id', sql.NVarChar, userId)
      .input('user_name', sql.NVarChar, userName)
      .input('action_type', sql.NVarChar, actionType)
      .input('details', sql.NVarChar, details)
      .input('target_id', sql.NVarChar, targetId ? String(targetId) : null)
      .input('target_type', sql.NVarChar, targetType || null)
      .query(`
        INSERT INTO activity_log (user_id, user_name, action_type, details, target_id, target_type)
        VALUES (@user_id, @user_name, @action_type, @details, @target_id, @target_type)
      `);
  } catch (error) {
    console.error("Failed to log activity:", error);
    // We don't re-throw the error because logging should not block the main operation.
  }
}

export interface ActivityLog {
    id: number;
    user_id: string;
    user_name: string;
    action_type: string;
    details: string;
    target_id: string;
    target_type: string;
    created_at: string;
}

export async function getActivityLogs(page: number = 1, limit: number = 20): Promise<{ logs: ActivityLog[], total: number }> {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const countRequest = pool.request();

        const countQuery = `SELECT COUNT(*) as total FROM activity_log`;
        const totalResult = await countRequest.query(countQuery);
        const total = totalResult.recordset[0].total;

        const offset = (page - 1) * limit;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const dataQuery = `
            SELECT * FROM activity_log
            ORDER BY created_at DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const result = await request.query(dataQuery);

        return {
            logs: result.recordset as ActivityLog[],
            total,
        };
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        throw new Error("Could not fetch activity logs from database.");
    }
}
