
"use server";

import { revalidatePath } from 'next/cache';
import { getDbPool, sql } from '@/lib/db';
import type { Staff } from '@/lib/types';

export type AttendanceRecord = {
  staff_id: string;
  date: Date;
  status: 'present' | 'absent';
};

export async function getStaffForAttendance(): Promise<Pick<Staff, 'id' | 'name'>[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query("SELECT uid as id, name FROM users WHERE role = 'Hospital Staff'");
    return result.recordset;
  } catch (error) {
    console.error("Error fetching staff for attendance:", error);
    throw new Error("Failed to fetch staff list.");
  }
}

export async function getAttendanceForMonth(month: number, year: number): Promise<Record<string, Record<number, boolean>>> {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('month', sql.Int, month)
      .input('year', sql.Int, year)
      .query(`
        SELECT staff_id, date 
        FROM attendance 
        WHERE MONTH(date) = @month AND YEAR(date) = @year AND status = 'present'
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

  if (!month || !year || !rawAttendanceData) {
    return { message: "Missing required data to save attendance.", type: "error" };
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
      .query('DELETE FROM attendance WHERE MONTH(date) = @month AND YEAR(date) = @year');

    for (const staffId in attendanceData) {
      for (const day in attendanceData[staffId]) {
        if (attendanceData[staffId][day]) {
          const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          await new sql.Request(transaction)
            .input('staff_id', sql.NVarChar, staffId)
            .input('date', sql.Date, date)
            .input('status', sql.NVarChar, 'present')
            .query('INSERT INTO attendance (staff_id, date, status) VALUES (@staff_id, @date, @status)');
        }
      }
    }

    await transaction.commit();
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
