
"use server";

import { mockPatients } from "@/lib/mock-data";
import { Patient } from "@/lib/types";
import { redirect } from 'next/navigation';

export async function handleAddPatient(prevState: { message: string }, formData: FormData) {
  const newPatientData = {
    fullName: formData.get("fullName") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    phoneNumber: formData.get("patientContact") as string,
    address: formData.get("patientAddress") as string,
    companyId: formData.get("insuranceCompany") as string,
    policyNumber: formData.get("policyNumber") as string,
    memberId: formData.get("memberId") as string,
    policyStartDate: formData.get("policyStartDate") as string,
    policyEndDate: formData.get("policyEndDate") as string,
    hospitalId: formData.get("hospitalId") as string,
    hospitalCode: formData.get("hospitalCode") as string,
    doctorName: formData.get("doctorName") as string,
    doctorSpeciality: formData.get("doctorSpeciality") as string,
    admissionDate: formData.get("admissionDate") as string,
    diagnosis: formData.get("diagnosis") as string,
    proposedTreatment: formData.get("proposedTreatment") as string,
    procedureCode: formData.get("procedureCode") as string,
    estimatedCost: formData.get("estimatedCost") as string,
    clinicalNotes: formData.get("clinicalNotes") as string,
  };

  // Basic validation
  for (const [key, value] of Object.entries(newPatientData)) {
    // Optional fields
    const optionalFields = ['hospitalCode', 'procedureCode', 'clinicalNotes'];
    if (optionalFields.includes(key)) continue;

    if (!value) {
      return { message: `Please fill all required fields. Missing: ${key}` };
    }
  }

  const newPatient: Patient = {
    id: `pat-${Date.now()}`,
    ...newPatientData,
    estimatedCost: Number(newPatientData.estimatedCost),
    // Fields not in this form but in type
    doctorRegistrationNumber: `DN-${Math.floor(Math.random() * 90000) + 10000}`,
  };

  mockPatients.push(newPatient);
  
  redirect('/dashboard/patients');
}

export async function handleUpdatePatient(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedPatientData = {
    fullName: formData.get("fullName") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    phoneNumber: formData.get("patientContact") as string,
    address: formData.get("patientAddress") as string,
    companyId: formData.get("insuranceCompany") as string,
    policyNumber: formData.get("policyNumber") as string,
    memberId: formData.get("memberId") as string,
    policyStartDate: formData.get("policyStartDate") as string,
    policyEndDate: formData.get("policyEndDate") as string,
    hospitalId: formData.get("hospitalId") as string,
    hospitalCode: formData.get("hospitalCode") as string,
    doctorName: formData.get("doctorName") as string,
    doctorSpeciality: formData.get("doctorSpeciality") as string,
    admissionDate: formData.get("admissionDate") as string,
    diagnosis: formData.get("diagnosis") as string,
    proposedTreatment: formData.get("proposedTreatment") as string,
    procedureCode: formData.get("procedureCode") as string,
    estimatedCost: formData.get("estimatedCost") as string,
    clinicalNotes: formData.get("clinicalNotes") as string,
  };
  
  if (!id) {
      return { message: "Patient ID is missing."}
  }

  // Basic validation
    for (const [key, value] of Object.entries(updatedPatientData)) {
    const optionalFields = ['hospitalCode', 'procedureCode', 'clinicalNotes'];
    if (optionalFields.includes(key)) continue;
    if (!value) {
      return { message: `Please fill all required fields. Missing: ${key}` };
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
  };

  redirect('/dashboard/patients');
}

export async function handleDeletePatient(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockPatients.findIndex(p => p.id === id);
    if (index > -1) {
        mockPatients.splice(index, 1);
    }
}
