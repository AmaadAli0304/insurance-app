
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const poolConnection = await pool.connect();
    const result = await poolConnection.request().query('SELECT * FROM users');
    poolConnection.close();
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}
