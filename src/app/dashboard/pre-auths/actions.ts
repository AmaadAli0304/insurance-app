
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

    // Editable Patient Details
    fullName: formData.get("name") as string,
    email_address: formData.get("email_address") as string,
    phoneNumber: formData.get("phone_number") as string,
    alternative_number: formData.get("alternative_number") as string,
    gender: formData.get("gender") as 'Male' | 'Female' | 'Other',
    age: Number(formData.get("age")),
    dateOfBirth: formData.get("birth_date") as string,
    address: formData.get("address") as string,
    occupation: formData.get("occupation") as string,
    employee_id: formData.get("employee_id") as string,
    abha_id: formData.get("abha_id") as string,
    health_id: formData.get("health_id") as string,

    // Admission Details
    admission_id: formData.get("admission_id") as string,
    relationship_policyholder: formData.get("relationship_policyholder") as string,
    policyNumber: formData.get("policy_number") as string,
    memberId: formData.get("insured_card_number") as string,
    policyStartDate: formData.get("policy_start_date") as string,
    policyEndDate: formData.get("policy_end_date") as string,
    corporate_policy_number: formData.get("corporate_policy_number") as string,
    other_policy_name: formData.get("other_policy_name") as string,
    family_doctor_name: formData.get("family_doctor_name") as string,
    family_doctor_phone: formData.get("family_doctor_phone") as string,
    payer_email: formData.get("payer_email") as string,
    payer_phone: formData.get("payer_phone") as string,

    // Treatment details
    treat_doc_name: formData.get("treat_doc_name") as string,
    treat_doc_number: formData.get("treat_doc_number") as string,
    treat_doc_qualification: formData.get("treat_doc_qualification") as string,
    treat_doc_reg_no: formData.get("treat_doc_reg_no") as string,
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
