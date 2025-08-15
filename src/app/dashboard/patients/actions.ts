
"use server";

import { mockPatients } from "@/lib/mock-data";
import { Patient } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddPatient(prevState: { message: string }, formData: FormData) {
  const newPatientData = {
    fullName: formData.get("fullName") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    phoneNumber: formData.get("phoneNumber") as string,
    companyId: formData.get("companyId") as string,
    policyNumber: formData.get("policyNumber") as string,
    hospitalId: formData.get("hospitalId") as string,
    hospitalCode: formData.get("hospitalCode") as string,
    doctorName: formData.get("doctorName") as string,
    doctorRegistrationNumber: formData.get("doctorRegistrationNumber") as string,
    diagnosis: formData.get("diagnosis") as string,
    proposedTreatment: formData.get("proposedTreatment") as string,
    estimatedCost: formData.get("estimatedCost") as string,
    admissionDate: formData.get("admissionDate") as string,
    expectedLengthOfStay: formData.get("expectedLengthOfStay") as string,
  };

  // Basic validation
  for (const [key, value] of Object.entries(newPatientData)) {
    if (!value) {
      // expectedLengthOfStay is optional
      if (key !== 'expectedLengthOfStay' && key !== 'hospitalCode' && key !== 'doctorRegistrationNumber' ) {
         return { message: `Please fill all required fields. Missing: ${key}` };
      }
    }
  }

  const newPatient: Patient = {
    id: `pat-${Date.now()}`,
    ...newPatientData,
    estimatedCost: Number(newPatientData.estimatedCost),
    expectedLengthOfStay: Number(newPatientData.expectedLengthOfStay),
    // Dummy data for fields not in form
    address: 'N/A',
    memberId: `MEM-${Date.now()}`,
    policyStartDate: 'N/A',
    policyEndDate: 'N/A',
  };

  mockPatients.push(newPatient);
  
  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function handleUpdatePatient(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
   const updatedPatientData = {
    fullName: formData.get("fullName") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    phoneNumber: formData.get("phoneNumber") as string,
    companyId: formData.get("companyId") as string,
    policyNumber: formData.get("policyNumber") as string,
    hospitalId: formData.get("hospitalId") as string,
    hospitalCode: formData.get("hospitalCode") as string,
    doctorName: formData.get("doctorName") as string,
    doctorRegistrationNumber: formData.get("doctorRegistrationNumber") as string,
    diagnosis: formData.get("diagnosis") as string,
    proposedTreatment: formData.get("proposedTreatment") as string,
    estimatedCost: formData.get("estimatedCost") as string,
    admissionDate: formData.get("admissionDate") as string,
    expectedLengthOfStay: formData.get("expectedLengthOfStay") as string,
  };
  
  if (!id) {
      return { message: "Patient ID is missing."}
  }

  // Basic validation
  for (const [key, value] of Object.entries(updatedPatientData)) {
    if (!value) {
       if (key !== 'expectedLengthOfStay' && key !== 'hospitalCode' && key !== 'doctorRegistrationNumber' ) {
         return { message: `Please fill all required fields. Missing: ${key}` };
      }
    }
  }

  const patientIndex = mockPatients.findIndex(p => p.id === id);

  if (patientIndex === -1) {
    return { message: "Patient not found." };
  }

  mockPatients[patientIndex] = {
    ...mockPatients[patientIndex],
    ...updatedPatientData,
    estimatedCost: Number(updatedPatientData.estimatedCost),
    expectedLengthOfStay: Number(updatedPatientData.expectedLengthOfStay),
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
