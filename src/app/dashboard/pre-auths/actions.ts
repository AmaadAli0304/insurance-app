
"use server";

import { mockStaffingRequests, mockPatients, mockHospitals, mockCompanies } from "@/lib/mock-data";
import { StaffingRequest, Patient } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddRequest(prevState: { message: string }, formData: FormData) {
  
  // This is a simplified handler. In a real app, you would have more robust validation
  // and would likely create/update both a Patient and a Request record.
  // Here, we'll primarily create a new StaffingRequest and a new Patient record for simplicity.

  const patientData = {
    id: formData.get("patientId") as string,
    fullName: formData.get("patientName") as string,
    dateOfBirth: formData.get("patientDOB") as string,
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    phoneNumber: formData.get("patientContact") as string,
    address: formData.get("patientAddress") as string,
    hospitalId: formData.get("hospitalId") as string,
    companyId: formData.get("insuranceCompany") as string,
    policyNumber: formData.get("policyNumber") as string,
    memberId: formData.get("memberId") as string,
    policyStartDate: formData.get("policyStartDate") as string,
    policyEndDate: formData.get("policyEndDate") as string,
    admissionDate: formData.get("admissionDate") as string,
    diagnosis: formData.get("diagnosis") as string,
    estimatedCost: Number(formData.get("estimatedCost")),
  };

  const requestData = {
    patientId: patientData.id,
    hospitalId: patientData.hospitalId,
    companyId: patientData.companyId,
    packageId: formData.get("procedureCode") as string, // Using packageId for procedureCode
    requestAmount: patientData.estimatedCost,
    details: formData.get("clinicalNotes") as string,
    doctorName: formData.get("doctorName") as string,
    doctorSpeciality: formData.get("doctorSpeciality") as string,
    proposedTreatment: formData.get("proposedTreatment") as string,
    expectedDischargeDate: formData.get("expectedDischargeDate") as string || undefined,
  };

  // Basic validation
  if (!patientData.id || !patientData.fullName || !requestData.details) {
    return { message: `Please fill all required fields.` };
  }

  // Create or update patient
  const existingPatientIndex = mockPatients.findIndex(p => p.id === patientData.id);
  if (existingPatientIndex > -1) {
    mockPatients[existingPatientIndex] = patientData;
  } else {
    mockPatients.push(patientData);
  }

  const newRequest: StaffingRequest = {
    id: `req-${Date.now()}`,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    ...requestData,
  };

  mockStaffingRequests.push(newRequest);
  
  revalidatePath('/dashboard/pre-auths');
  redirect('/dashboard/pre-auths');
}

export async function handleUpdateRequest(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const updatedRequestData = {
    patientId: formData.get("patientId"),
    hospitalId: formData.get("hospitalId"),
    companyId: formData.get("companyId"),
    packageId: formData.get("packageId"),
    requestAmount: formData.get("requestAmount"),
    status: formData.get("status"),
    details: formData.get("details"),
    doctorName: formData.get("doctorName"),
    doctorSpeciality: formData.get("doctorSpeciality"),
    proposedTreatment: formData.get("proposedTreatment"),
  };
  
  if (!id) {
      return { message: "Request ID is missing."}
  }

  // Basic validation
  for (const [key, value] of Object.entries(updatedRequestData)) {
    if (!value) {
      return { message: `Please fill all fields. Missing: ${key}` };
    }
  }

  const requestIndex = mockStaffingRequests.findIndex(r => r.id === id);

  if (requestIndex === -1) {
    return { message: "Request not found." };
  }

  mockStaffingRequests[requestIndex] = {
    ...mockStaffingRequests[requestIndex],
    patientId: updatedRequestData.patientId as string,
    hospitalId: updatedRequestData.hospitalId as string,
    companyId: updatedRequestData.companyId as string,
    packageId: updatedRequestData.packageId as string,
    requestAmount: Number(updatedRequestData.requestAmount),
    status: updatedRequestData.status as 'Pending' | 'Approved' | 'Rejected',
    details: updatedRequestData.details as string,
    doctorName: updatedRequestData.doctorName as string,
    doctorSpeciality: updatedRequestData.doctorSpeciality as string,
    proposedTreatment: updatedRequestData.proposedTreatment as string,
  };

  revalidatePath('/dashboard/pre-auths');
  redirect('/dashboard/pre-auths');
}

export async function handleDeleteRequest(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockStaffingRequests.findIndex(r => r.id === id);
    if (index > -1) {
        mockStaffingRequests.splice(index, 1);
    }
    revalidatePath('/dashboard/pre-auths');
}
