
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const hospitalSchema = z.object({
  name: z.string(),
  address: z.string(),
  location: z.string().optional(),
  contact: z.string(),
  // Add other fields as necessary from your hospital type
});

export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM hospitals');
    connection.release();
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching hospitals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, location, contact } = hospitalSchema.parse(body);

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO hospitals (name, address, location, contact) VALUES (?, ?, ?, ?)',
      [name, address, location, contact]
    );
    connection.release();

    const insertedId = (result as any).insertId;
    return NextResponse.json({ id: insertedId, name, address, location, contact }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Error creating hospital' }, { status: 500 });
  }
}
