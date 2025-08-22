
import { NextResponse } from 'next/server';
import pool, { sql, poolConnect } from '@/lib/db';
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
    await poolConnect;
    const result = await pool.request().query('SELECT * FROM hospitals');
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching hospitals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, location, contact } = hospitalSchema.parse(body);

    await poolConnect;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('address', sql.NVarChar, address)
      .input('location', sql.NVarChar, location)
      .input('contact', sql.NVarChar, contact)
      .query('INSERT INTO hospitals (name, address, location, contact) OUTPUT INSERTED.id VALUES (@name, @address, @location, @contact)');
    
    const insertedId = result.recordset[0].id;
    return NextResponse.json({ id: insertedId, name, address, location, contact }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Error creating hospital' }, { status: 500 });
  }
}
