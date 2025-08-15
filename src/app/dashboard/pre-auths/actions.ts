
"use server";

import { mockStaffingRequests } from "@/lib/mock-data";
import { StaffingRequest } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddRequest(prevState: { message: string }, formData: FormData) {
  const newRequestData = {
    patientId: formData.get("patientId"),
    hospitalId: formData.get("hospitalId"),
    companyId: formData.get("companyId"),
    packageId: formData.get("packageId"),
    requestAmount: formData.get("requestAmount"),
    details: formData.get("details"),
  };

  // Basic validation
  for (const [key, value] of Object.entries(newRequestData)) {
    if (!value) {
      return { message: `Please fill all fields. Missing: ${key}` };
    }
  }

  const newRequest: StaffingRequest = {
    id: `req-${Date.now()}`,
    patientId: newRequestData.patientId as string,
    hospitalId: newRequestData.hospitalId as string,
    companyId: newRequestData.companyId as string,
    packageId: newRequestData.packageId as string,
    requestAmount: Number(newRequestData.requestAmount),
    status: 'Pending',
    createdAt: new Date().toISOString(),
    details: newRequestData.details as string,
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
