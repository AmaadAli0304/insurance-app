
"use server";

import { mockCompanies } from "@/lib/mock-data";
import { Company, Policy } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddCompany(prevState: { message: string }, formData: FormData) {
  const newCompanyData = {
    name: formData.get("name") as string,
    registrationNumber: formData.get("registrationNumber") as string,
    contactPerson: formData.get("contactPerson") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    address: formData.get("address") as string,
  };

  if (!newCompanyData.name || !newCompanyData.contactPerson) {
    return { message: "Please fill all required fields." };
  }

  const newCompany: Company = {
    id: `comp-${Date.now()}`,
    ...newCompanyData,
    policies: [], // Policies are managed separately
    assignedHospitals: [], // Managed separately
  };

  mockCompanies.push(newCompany);
  
  revalidatePath('/dashboard/companies');
  redirect('/dashboard/companies');
}

export async function handleUpdateCompany(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedData = {
    name: formData.get("name") as string,
    registrationNumber: formData.get("registrationNumber") as string,
    contactPerson: formData.get("contactPerson") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    address: formData.get("address") as string,
  };

  if (!id) {
    return { message: "Company ID is missing." };
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
