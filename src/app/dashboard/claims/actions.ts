
"use server";

import { mockClaims, mockPatients } from "@/lib/mock-data";
import { Claim, ClaimStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function handleAddClaim(prevState: { message: string }, formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const requestId = formData.get("requestId") as string;
  const claimAmount = formData.get("claimAmount") as string;
  const notes = formData.get("notes") as string;

  if (!patientId || !requestId || !claimAmount) {
    return { message: "Please fill all required fields." };
  }
  
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
      return { message: "Patient not found." };
  }

  const newClaim: Claim = {
    id: `claim-${Date.now()}`,
    patientId,
    requestId,
    claimAmount: Number(claimAmount),
    notes,
    hospitalId: patient.hospitalId,
    companyId: patient.companyId,
    status: 'Processing',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockClaims.push(newClaim);
  
  revalidatePath('/dashboard/claims');
  redirect('/dashboard/claims');
}

export async function handleUpdateClaim(prevState: { message: string }, formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as ClaimStatus;
  const notes = formData.get("notes") as string;
  const paidAmount = formData.get("paidAmount") as string;

  if (!id || !status) {
    return { message: "Required fields are missing." };
  }

  const claimIndex = mockClaims.findIndex(c => c.id === id);

  if (claimIndex === -1) {
    return { message: "Claim not found." };
  }

  mockClaims[claimIndex] = {
    ...mockClaims[claimIndex],
    status,
    notes: notes || mockClaims[claimIndex].notes,
    paidAmount: paidAmount ? Number(paidAmount) : mockClaims[claimIndex].paidAmount,
    updatedAt: new Date().toISOString(),
  };

  revalidatePath('/dashboard/claims');
  redirect('/dashboard/claims');
}

export async function handleDeleteClaim(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockClaims.findIndex(h => h.id === id);
    if (index > -1) {
        mockClaims.splice(index, 1);
    }
    revalidatePath('/dashboard/claims');
}
