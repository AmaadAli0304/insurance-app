
"use server";

import { mockStaffingRequests, mockPatients } from "@/lib/mock-data";
import { StaffingRequest, Patient } from "@/lib/types";
import { redirect } from 'next/navigation';

export async function handleAddRequest(prevState: { message: string, type?:string }, formData: FormData) {
  
  const patientId = formData.get("patientId") as string;
  const toEmail = formData.get("to") as string;
  const subject = formData.get("subject") as string;
  const details = formData.get("details") as string;
  const hospitalId = formData.get("hospitalId") as string;
  const fromEmail = formData.get("from") as string;

  if (!patientId || !toEmail || !subject || !details || !hospitalId) {
    return { message: `Please fill all required fields.`, type: 'error' };
  }

  // This part of the logic remains with mock data as there is no `patients` table with all fields yet.
  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    return { message: "Selected patient not found.", type: 'error' };
  }

  const newRequest: StaffingRequest = {
    id: `req-${Date.now()}`,
    patientId: patient.id,
    hospitalId: hospitalId,
    companyId: patient.companyId, // Infer company from patient
    status: 'Pending',
    createdAt: new Date().toISOString(),
    details: details,
    subject: subject,
    email: toEmail, // 'to' field from form
    fromEmail: fromEmail,
    requestAmount: patient.estimatedCost,
    doctorName: patient.doctorName,
    proposedTreatment: patient.proposedTreatment,
    packageId: "N/A",
  };

  mockStaffingRequests.push(newRequest);
  
  return { message: "Request sent successfully", type: 'success' };
}


export async function handleDeleteRequest(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockStaffingRequests.findIndex(r => r.id === id);
    if (index > -1) {
        mockStaffingRequests.splice(index, 1);
    }
}
