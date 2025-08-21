
import { NextResponse } from 'next/server';
import pool, { sql, poolConnect } from '@/lib/db';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedData = signupSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ message: 'Invalid request body', errors: parsedData.error.errors }, { status: 400 });
    }
    
    const { email, password } = parsedData.data;
    
    await poolConnect; // Ensures the pool is connected

    // Check if user already exists
    const userExistsResult = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT uid FROM users WHERE email = @email');

    if (userExistsResult.recordset.length > 0) {
        return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // In a real application, you should hash the password before saving it.
    // For consistency with the current login setup, we are saving it as plain text.
    const uid = `user-${Date.now()}`;
    const name = email.split('@')[0]; // Simple name generation
    const role = 'Hospital Staff'; // Default role for new signups

    await pool.request()
      .input('uid', sql.NVarChar, uid)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('role', sql.NVarChar, role)
      .input('password', sql.NVarChar, password) // Storing plain text password
      .query(`
        INSERT INTO users (uid, name, email, role, password, hospitalId, companyId) 
        VALUES (@uid, @name, @email, @role, @password, NULL, NULL)
      `);

    return NextResponse.json({ message: 'User created successfully', userId: uid }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }
    console.error(error);
    const dbError = error as { code?: string };
    if (dbError.code === 'ELOGIN' || dbError.code === 'ETIMEOUT' || dbError.code === 'ECONNRESET') {
        return NextResponse.json({ message: 'Failed to connect to the database. Please check your connection settings.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
