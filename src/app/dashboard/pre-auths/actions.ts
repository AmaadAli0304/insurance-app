
"use server";

import { mockStaffingRequests, mockPatients } from "@/lib/mock-data";
import { StaffingRequest, Patient } from "@/lib/types";
import { redirect } from 'next/navigation';
import { getPatientById } from "../patients/actions";

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

  const patient = await getPatientById(patientId);
  if (!patient) {
    return { message: "Selected patient not found.", type: 'error' };
  }

  const newRequest: StaffingRequest = {
    id: `req-${Date.now()}`,
    patientId: patient.id,
    hospitalId: hospitalId,
    companyId: patient.companyId,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    details: details,
    subject: subject,
    email: toEmail,
    fromEmail: fromEmail,
    requestAmount: Number(formData.get("estimatedCost")) || patient.estimatedCost,
    doctorName: formData.get("doctorName") as string || patient.treat_doc_name,
    proposedTreatment: formData.get("proposedTreatment") as string || patient.proposedTreatment,
    admissionId: formData.get("admissionId") as string || patient.admission_id,
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

    