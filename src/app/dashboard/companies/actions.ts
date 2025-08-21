
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import sql from 'mssql';
import { Company } from "@/lib/types";
import { mockCompanies } from "@/lib/mock-data";


export async function handleAddCompany(prevState: { message: string, type?: string }, formData: FormData) {
  const name = formData.get("name") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const portalLink = formData.get("portalLink") as string;


  if (!name || !email || !address) {
    return { message: "Please fill all required fields.", type: "error" };
  }

  try {
    const poolConnection = await pool.connect();
    const id = `comp-${Date.now()}`;

    await poolConnection.request()
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
    
    poolConnection.close();
  } catch (error) {
      console.error('Error adding company:', error);
      const dbError = error as { message?: string };
      return { message: `Error adding company: ${dbError.message || 'Unknown error'}`, type: "error" };
  }
  
  revalidatePath('/dashboard/companies');
  // We are returning a success message now instead of redirecting.
  // The client will handle the toast and redirection.
  return { message: "company added successfully", type: "success" };
}

export async function handleUpdateCompany(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedData = {
    name: formData.get("name") as string,
    contactPerson: formData.get("contactPerson") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    address: formData.get("address") as string,
    portalLink: formData.get("portalLink") as string,
  };


  if (!id) {
    return { message: "Company ID is missing." };
  }
  
  if (!updatedData.name || !updatedData.email || !updatedData.address) {
    return { message: "Please fill all required fields." };
  }

  const companyIndex = mockCompanies.findIndex(c => c.id === id);

  if (companyIndex === -1) {
    return { message: "Company not found." };
  }

  mockCompanies[companyIndex] = {
    ...mockCompanies[companyIndex],
    ...updatedData,
  };

  revalidatePath('/dashboard/companies');
  redirect('/dashboard/companies');
}

export async function handleDeleteCompany(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockCompanies.findIndex(c => c.id === id);
    if (index > -1) {
        mockCompanies.splice(index, 1);
    }
    revalidatePath('/dashboard/companies');
}
