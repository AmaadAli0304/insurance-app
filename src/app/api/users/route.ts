
import { NextResponse } from 'next/server';
import pool, { poolConnect } from '@/lib/db';

export async function GET() {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT * FROM users');
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}
