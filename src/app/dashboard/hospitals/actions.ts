
"use server";

import { mockHospitals } from "@/lib/mock-data";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddHospital(prevState: { message: string }, formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const contact = formData.get("contact") as string;

  if (!name || !address || !contact) {
    return { message: "Please fill all fields." };
  }

  const newHospital = {
    id: `hosp-${Date.now()}`,
    name,
    address,
    contact,
    assignedInsuranceCompanies: [],
  };

  mockHospitals.push(newHospital);
  
  revalidatePath('/dashboard/hospitals');
  redirect('/dashboard/hospitals');
}

export async function handleUpdateHospital(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const contact = formData.get("contact") as string;

  if (!id || !name || !address || !contact) {
    return { message: "Please fill all fields." };
  }

  const hospitalIndex = mockHospitals.findIndex(h => h.id === id);

  if (hospitalIndex === -1) {
    return { message: "Hospital not found." };
  }

  mockHospitals[hospitalIndex] = {
    ...mockHospitals[hospitalIndex],
    name,
    address,
    contact,
  };

  revalidatePath('/dashboard/hospitals');
  redirect('/dashboard/hospitals');
}

export async function handleDeleteHospital(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockHospitals.findIndex(h => h.id === id);
    if (index > -1) {
        mockHospitals.splice(index, 1);
    }
    revalidatePath('/dashboard/hospitals');
}
