
import { NextResponse, type NextRequest } from 'next/server';
import { getDbPool, sql } from '@/lib/db';
import { z } from 'zod';
import { Company } from '@/lib/types';

const companySchema = z.object({
  name: z.string().min(1, { message: "Company name is required" }),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  address: z.string().optional(),
  portalLink: z.string().url({ message: "Invalid URL format" }).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedData = companySchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ message: 'Invalid request body', errors: parsedData.error.errors }, { status: 400 });
    }
    
    const { name, contactPerson, phone, email, address, portalLink } = parsedData.data;
    
    const id = `comp-${Date.now()}`;
    
    const pool = await getDbPool();
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('contactPerson', sql.NVarChar, contactPerson)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('address', sql.NVarChar, address)
      .input('portalLink', sql.NVarChar, portalLink)
      .query(`
        INSERT INTO companies (id, name, contactPerson, phone, email, address, portalLink) 
        VALUES (@id, @name, @contactPerson, @phone, @email, @address, @portalLink)
      `);


    return NextResponse.json({ message: 'Company created successfully', companyId: id }, { status: 201 });

  } catch (error) {
    console.error('Error creating company:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error creating company' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  try {
    const pool = await getDbPool();
    const requestPool = pool.request();
    
    const companiesResult = await requestPool
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT * FROM companies
        ORDER BY name
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
      
    const totalResult = await pool.request().query('SELECT COUNT(*) as total FROM companies');
    const totalCompanies = totalResult.recordset[0].total;

    return NextResponse.json({
      companies: companiesResult.recordset as Company[],
      total: totalCompanies,
      page,
      limit
    });
  } catch (error) {
      console.error('Error fetching companies:', error);
      const dbError = error as Error;
      return NextResponse.json({ message: `Error fetching companies: ${dbError.message}`}, { status: 500 });
  }
}
