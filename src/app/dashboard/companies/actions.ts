
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { Company } from "@/lib/types";
import { mockCompanies } from "@/lib/mock-data";


export async function handleAddCompany(prevState: { message: string, type?: string }, formData: FormData) {
  const name = formData.get("name") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const portalLink = formData.get("portalLink") as string;


  if (!name) {
    return { message: "Please fill the required company name field.", type: "error" };
  }

  const newCompany: Company = {
    id: `comp-${Date.now()}`,
    name,
    contactPerson,
    phone,
    email,
    address,
    portalLink,
    assignedHospitals: [],
    policies: [],
  };

  mockCompanies.push(newCompany);
  
  revalidatePath('/dashboard/companies');
  redirect('/dashboard/companies');
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
  
  if (!updatedData.name) {
    return { message: "Company name is a required field." };
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
