
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';
import sql from 'mssql';

const hospitalUpdateSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  location: z.string().optional(),
  contact: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const poolConnection = await pool.connect();
    const result = await poolConnection.request()
        .input('id', sql.Int, Number(params.id))
        .query('SELECT * FROM hospitals WHERE id = @id');
    poolConnection.close();

    if (result.recordset.length === 0) {
      return NextResponse.json({ message: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching hospital' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsedData = hospitalUpdateSchema.parse(body);

    const fieldsToUpdate = Object.entries(parsedData).filter(([, value]) => value !== undefined);
    if (fieldsToUpdate.length === 0) {
        return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const setClause = fieldsToUpdate.map(([key]) => `${key} = @${key}`).join(', ');
    
    const poolConnection = await pool.connect();
    const req = poolConnection.request();

    fieldsToUpdate.forEach(([key, value]) => {
        req.input(key, sql.NVarChar, value);
    });

    const result = await req
      .input('id', sql.Int, Number(params.id))
      .query(`UPDATE hospitals SET ${setClause} WHERE id = @id`);
      
    poolConnection.close();

    if (result.rowsAffected[0] === 0) {
        return NextResponse.json({ message: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Hospital updated successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Error updating hospital' }, { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const poolConnection = await pool.connect();
    const result = await poolConnection.request()
      .input('id', sql.Int, Number(params.id))
      .query('DELETE FROM hospitals WHERE id = @id');
    poolConnection.close();

    if (result.rowsAffected[0] === 0) {
        return NextResponse.json({ message: 'Hospital not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Hospital deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error deleting hospital' }, { status: 500 });
  }
}
