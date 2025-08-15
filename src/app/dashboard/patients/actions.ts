
"use server";

import { mockPatients } from "@/lib/mock-data";
import { Patient } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddPatient(prevState: { message: string }, formData: FormData) {
  const newPatientData = {
    fullName: formData.get("fullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    phoneNumber: formData.get("phoneNumber"),
    companyId: formData.get("companyId"),
    policyNumber: formData.get("policyNumber"),
    policyStartDate: formData.get("policyStartDate"),
    policyEndDate: formData.get("policyEndDate"),
    hospitalId: formData.get("hospitalId"),
    admissionDate: formData.get("admissionDate"),
    diagnosis: formData.get("diagnosis"),
    estimatedCost: formData.get("estimatedCost"),
  };

  // Basic validation
  for (const [key, value] of Object.entries(newPatientData)) {
    if (!value) {
      return { message: `Please fill all fields. Missing: ${key}` };
    }
  }

  const newPatient: Patient = {
    id: `pat-${Date.now()}`,
    fullName: newPatientData.fullName as string,
    dateOfBirth: newPatientData.dateOfBirth as string,
    gender: newPatientData.gender as 'Male' | 'Female' | 'Other',
    phoneNumber: newPatientData.phoneNumber as string,
    companyId: newPatientData.companyId as string,
    policyNumber: newPatientData.policyNumber as string,
    policyStartDate: newPatientData.policyStartDate as string,
    policyEndDate: newPatientData.policyEndDate as string,
    hospitalId: newPatientData.hospitalId as string,
    admissionDate: newPatientData.admissionDate as string,
    diagnosis: newPatientData.diagnosis as string,
    estimatedCost: Number(newPatientData.estimatedCost),
  };

  mockPatients.push(newPatient);
  
  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function handleUpdatePatient(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedPatientData = {
    fullName: formData.get("fullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    phoneNumber: formData.get("phoneNumber"),
    companyId: formData.get("companyId"),
    policyNumber: formData.get("policyNumber"),
    policyStartDate: formData.get("policyStartDate"),
    policyEndDate: formData.get("policyEndDate"),
    hospitalId: formData.get("hospitalId"),
    admissionDate: formData.get("admissionDate"),
    diagnosis: formData.get("diagnosis"),
    estimatedCost: formData.get("estimatedCost"),
  };
  
  if (!id) {
      return { message: "Patient ID is missing."}
  }

  // Basic validation
  for (const [key, value] of Object.entries(updatedPatientData)) {
    if (!value) {
      return { message: `Please fill all fields. Missing: ${key}` };
    }
  }

  const patientIndex = mockPatients.findIndex(p => p.id === id);

  if (patientIndex === -1) {
    return { message: "Patient not found." };
  }

  mockPatients[patientIndex] = {
    ...mockPatients[patientIndex],
    fullName: updatedPatientData.fullName as string,
    dateOfBirth: updatedPatientData.dateOfBirth as string,
    gender: updatedPatientData.gender as 'Male' | 'Female' | 'Other',
    phoneNumber: updatedPatientData.phoneNumber as string,
    companyId: updatedPatientData.companyId as string,
    policyNumber: updatedPatientData.policyNumber as string,
    policyStartDate: updatedPatientData.policyStartDate as string,
    policyEndDate: updatedPatientData.policyEndDate as string,
    hospitalId: updatedPatientData.hospitalId as string,
    admissionDate: updatedPatientData.admissionDate as string,
    diagnosis: updatedPatientData.diagnosis as string,
    estimatedCost: Number(updatedPatientData.estimatedCost),
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
