
"use server";

import { revalidatePath } from 'next/cache';
import { getDbPool, sql } from '@/lib/db';
import type { Staff } from '@/lib/types';
import { logActivity } from '@/lib/activity-log';

export type AttendanceRecord = {
  staff_id: string;
  date: Date;
  status: 'present' | 'absent';
  hospital_id: string;
};

export async function getStaffForAttendance(hospitalId: string | null): Promise<Pick<Staff, 'id' | 'name'>[]> {
  if (!hospitalId) return [];
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('hospitalId', sql.NVarChar, hospitalId)
      .query(`
        SELECT u.uid as id, u.name 
        FROM users u
        JOIN hospital_staff hs ON u.uid = hs.staff_id
        WHERE hs.hospital_id = @hospitalId AND u.role = 'Hospital Staff'
      `);
    return result.recordset;
  } catch (error) {
    console.error("Error fetching staff for attendance:", error);
    throw new Error("Failed to fetch staff list.");
  }
}

export async function getAttendanceForMonth(month: number, year: number, hospitalId: string | null): Promise<Record<string, Record<number, boolean>>> {
  if (!hospitalId) return {};
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('month', sql.Int, month)
      .input('year', sql.Int, year)
      .input('hospitalId', sql.NVarChar, hospitalId)
      .query(`
        SELECT staff_id, date 
        FROM attendance 
        WHERE MONTH(date) = @month AND YEAR(date) = @year AND status = 'present' AND hospital_id = @hospitalId
      `);
    
    const attendanceByStaff: Record<string, Record<number, boolean>> = {};
    
    result.recordset.forEach(record => {
      const staffId = record.staff_id;
      const day = new Date(record.date).getDate();
      if (!attendanceByStaff[staffId]) {
        attendanceByStaff[staffId] = {};
      }
      attendanceByStaff[staffId][day] = true;
    });

    return attendanceByStaff;
  } catch (error) {
    console.error("Error fetching attendance:", error);
    throw new Error("Failed to fetch attendance records.");
  }
}


export async function saveAttendance(prevState: { message: string, type?: string }, formData: FormData) {
  const month = formData.get('month') as string;
  const year = formData.get('year') as string;
  const rawAttendanceData = formData.get('attendanceData') as string;
  const hospitalId = formData.get('hospitalId') as string;
  const userId = formData.get('userId') as string;
  const userName = formData.get('userName') as string;

  if (!month || !year || !rawAttendanceData || !hospitalId) {
    return { message: "Missing required data to save attendance. Please select a hospital.", type: "error" };
  }
  
  const attendanceData = JSON.parse(rawAttendanceData);

  let transaction;
  try {
    const pool = await getDbPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Clear existing records for the month to avoid duplicates
    await new sql.Request(transaction)
      .input('month', sql.Int, parseInt(month, 10))
      .input('year', sql.Int, parseInt(year, 10))
      .input('hospital_id', sql.NVarChar, hospitalId)
      .query('DELETE FROM attendance WHERE MONTH(date) = @month AND YEAR(date) = @year AND hospital_id = @hospital_id');

    for (const staffId in attendanceData) {
      for (const day in attendanceData[staffId]) {
        if (attendanceData[staffId][day]) {
          const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          await new sql.Request(transaction)
            .input('staff_id', sql.NVarChar, staffId)
            .input('date', sql.Date, date)
            .input('status', sql.NVarChar, 'present')
            .input('hospital_id', sql.NVarChar, hospitalId)
            .query('INSERT INTO attendance (staff_id, date, status, hospital_id) VALUES (@staff_id, @date, @status, @hospital_id)');
        }
      }
    }

    await transaction.commit();

    await logActivity({
        userId,
        userName,
        actionType: 'SAVE_ATTENDANCE',
        details: `Saved attendance for hospital ID: ${hospitalId} for month ${month}/${year}.`,
        targetId: hospitalId,
        targetType: 'Attendance'
    });

    revalidatePath('/dashboard/attendance');
    return { message: 'Attendance saved successfully!', type: 'success' };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Error saving attendance:", error);
    const dbError = error as Error;
    return { message: `Database error: ${dbError.message}`, type: 'error' };
  }
}
