
import { NextResponse } from 'next/server';
import pool, { sql, poolConnect } from '@/lib/db';
import { z } from 'zod';
import { Company } from '@/lib/types';


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await poolConnect;

    const [companyResult, hospitalsResult] = await Promise.all([
        pool.request()
          .input('id', sql.NVarChar, params.id)
          .query('SELECT * FROM companies WHERE id = @id'),
        pool.request()
          .input('company_id', sql.NVarChar, params.id)
          .query('SELECT h.id, h.name FROM hospitals h JOIN hospital_companies hc ON h.id = hc.hospital_id WHERE hc.company_id = @company_id')
    ]);

    if (companyResult.recordset.length === 0) {
      return NextResponse.json({ message: 'Company not found' }, { status: 404 });
    }
    
    const company = companyResult.recordset[0] as Company;
    company.assignedHospitalsDetails = hospitalsResult.recordset;

    return NextResponse.json(company);

  } catch (error) {
    console.error('Error fetching company by ID:', error);
    return NextResponse.json({ message: 'Failed to fetch company details from the database.' }, { status: 500 });
  }
}
