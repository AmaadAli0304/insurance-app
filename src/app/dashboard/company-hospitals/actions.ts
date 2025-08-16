
"use server";

import { mockHospitals } from "@/lib/mock-data";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddHospital(prevState: { message: string }, formData: FormData) {
    const companyId = formData.get("companyId") as string;
    const newHospitalData = {
        name: formData.get("name") as string,
        registrationNumber: formData.get("registrationNumber") as string,
        contactPerson: formData.get("contactPerson") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        servicesOffered: (formData.get("servicesOffered") as string || '').split(',').map(s => s.trim()).filter(Boolean),
    };

  // Basic validation
  if (!newHospitalData.name || !newHospitalData.address || !newHospitalData.contactPerson) {
    return { message: "Please fill all required fields." };
  }

  const newHospital = {
    id: `hosp-${Date.now()}`,
    ...newHospitalData,
    assignedCompanies: [companyId], // Assign to the current company
    // Default empty values for other fields
    contact: newHospitalData.phone,
    assignedTPAs: [],
  };

  mockHospitals.push(newHospital);
  
  revalidatePath('/dashboard/company-hospitals');
  redirect('/dashboard/company-hospitals');
}

export async function handleUpdateHospital(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedData = {
        name: formData.get("name") as string,
        registrationNumber: formData.get("registrationNumber") as string,
        contactPerson: formData.get("contactPerson") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        address: formData.get("address") as string,
        servicesOffered: (formData.get("servicesOffered") as string || '').split(',').map(s => s.trim()).filter(Boolean),
    };

  if (!id) {
    return { message: "Hospital ID is missing." };
  }

  const hospitalIndex = mockHospitals.findIndex(h => h.id === id);

  if (hospitalIndex === -1) {
    return { message: "Hospital not found." };
  }

  mockHospitals[hospitalIndex] = {
    ...mockHospitals[hospitalIndex],
    ...updatedData,
    contact: updatedData.phone || mockHospitals[hospitalIndex].contact,
  };

  revalidatePath('/dashboard/company-hospitals');
  redirect('/dashboard/company-hospitals');
}

export async function handleDeleteHospital(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockHospitals.findIndex(h => h.id === id);
    if (index > -1) {
        mockHospitals.splice(index, 1);
    }
    revalidatePath('/dashboard/company-hospitals');
}
