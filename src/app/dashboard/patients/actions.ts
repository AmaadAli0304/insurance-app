
"use server";

import { mockPatients } from "@/lib/mock-data";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddPatient(prevState: { message: string }, formData: FormData) {
  const name = formData.get("name") as string;
  const dob = formData.get("dob") as string;
  const hospitalId = formData.get("hospitalId") as string;
  const companyId = formData.get("companyId") as string;
  const packageId = formData.get("packageId") as string;

  if (!name || !dob || !hospitalId || !companyId || !packageId) {
    return { message: "Please fill all fields." };
  }

  const newPatient = {
    id: `pat-${Date.now()}`,
    name,
    dob,
    hospitalId,
    companyId,
    packageId,
  };

  mockPatients.push(newPatient);
  
  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function handleUpdatePatient(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const dob = formData.get("dob") as string;
  const hospitalId = formData.get("hospitalId") as string;
  const companyId = formData.get("companyId") as string;
  const packageId = formData.get("packageId") as string;

  if (!id || !name || !dob || !hospitalId || !companyId || !packageId) {
    return { message: "Please fill all fields." };
  }

  const patientIndex = mockPatients.findIndex(p => p.id === id);

  if (patientIndex === -1) {
    return { message: "Patient not found." };
  }

  mockPatients[patientIndex] = {
    ...mockPatients[patientIndex],
    name,
    dob,
    hospitalId,
    companyId,
    packageId,
  };

  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function handleDeletePatient(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockPatients.findIndex(p => p.id === id);
    if (index > -1) {
        mockPatients.splice(index, 1);
    }
    revalidatePath('/dashboard/patients');
}
