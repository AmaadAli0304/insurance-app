
"use server";

import { mockStaffingRequests, mockPatients } from "@/lib/mock-data";
import { StaffingRequest, Patient } from "@/lib/types";
import { redirect } from 'next/navigation';
import { getPatientById } from "../patients/actions";
import nodemailer from "nodemailer";

async function sendPreAuthEmail(requestData: StaffingRequest) {
    const { 
        MAILTRAP_HOST, 
        MAILTRAP_PORT, 
        MAILTRAP_USER, 
        MAILTRAP_PASS 
    } = process.env;

    if (!MAILTRAP_HOST || !MAILTRAP_PORT || !MAILTRAP_USER || !MAILTRAP_PASS) {
        console.error("Mailtrap environment variables are not set.");
        throw new Error("Email service is not configured.");
    }
    
    const transporter = nodemailer.createTransport({
        host: MAILTRAP_HOST,
        port: Number(MAILTRAP_PORT),
        auth: {
          user: MAILTRAP_USER,
          pass: MAILTRAP_PASS
        }
    });

    const htmlBody = `
        <h1>Pre-Authorization Request</h1>
        <p><strong>Request ID:</strong> ${requestData.id}</p>
        <p><strong>Patient Name:</strong> ${requestData.fullName}</p>
        <p><strong>Policy Number:</strong> ${requestData.policyNumber}</p>
        <p><strong>Total Estimated Cost:</strong> ${requestData.totalExpectedCost?.toLocaleString()}</p>
        <hr>
        <h2>Details:</h2>
        <div>${requestData.details}</div>
        <hr>
        <p>This is an automated message. Please do not reply directly to this email.</p>
    `;

    await transporter.sendMail({
        from: `"${requestData.fromEmail}" <donotreply@onestop.com>`,
        to: requestData.email,
        subject: requestData.subject,
        html: htmlBody,
    });
}


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
    requestAmount: Number(formData.get("totalExpectedCost")) || patient.estimatedCost,

    // Editable Patient Details
    fullName: `${formData.get("firstName")} ${formData.get("lastName")}`,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
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

     // C. Clinical Information
    natureOfIllness: formData.get("natureOfIllness") as string,
    clinicalFindings: formData.get("clinicalFindings") as string,
    ailmentDuration: Number(formData.get("ailmentDuration")),
    firstConsultationDate: formData.get("firstConsultationDate") as string,
    pastHistory: formData.get("pastHistory") as string,
    provisionalDiagnosis: formData.get("provisionalDiagnosis") as string,
    icd10Codes: formData.get("icd10Codes") as string,
    treatmentMedical: formData.get("treatmentMedical") as string,
    treatmentSurgical: formData.get("treatmentSurgical") as string,
    treatmentIntensiveCare: formData.get("treatmentIntensiveCare") as string,
    treatmentInvestigation: formData.get("treatmentInvestigation") as string,
    treatmentNonAllopathic: formData.get("treatmentNonAllopathic") as string,
    investigationDetails: formData.get("investigationDetails") as string,
    drugRoute: formData.get("drugRoute") as string,
    procedureName: formData.get("procedureName") as string,
    icd10PcsCodes: formData.get("icd10PcsCodes") as string,
    otherTreatments: formData.get("otherTreatments") as string,

    // D. Accident / Medico-Legal
    isInjury: formData.get("isInjury") === 'on',
    injuryCause: formData.get("injuryCause") as string,
    isRta: formData.get("isRta") === 'on',
    injuryDate: formData.get("injuryDate") as string,
    isReportedToPolice: formData.get("isReportedToPolice") === 'on',
    firNumber: formData.get("firNumber") as string,
    isAlcoholSuspected: formData.get("isAlcoholSuspected") === 'on',
    isToxicologyConducted: formData.get("isToxicologyConducted") === 'on',

    // E. Maternity
    isMaternity: formData.get("isMaternity") === 'on',
    g: Number(formData.get("g")),
    p: Number(formData.get("p")),
    l: Number(formData.get("l")),
    a: Number(formData.get("a")),
    expectedDeliveryDate: formData.get("expectedDeliveryDate") as string,

    // F. Admission & Cost Estimate
    admissionDate: formData.get("admissionDate") as string,
    admissionTime: formData.get("admissionTime") as string,
    admissionType: formData.get("admissionType") as string,
    expectedStay: Number(formData.get("expectedStay")),
    expectedIcuStay: Number(formData.get("expectedIcuStay")),
    roomCategory: formData.get("roomCategory") as string,
    roomNursingDietCost: Number(formData.get("roomNursingDietCost")),
    investigationCost: Number(formData.get("investigationCost")),
    icuCost: Number(formData.get("icuCost")),
    otCost: Number(formData.get("otCost")),
    professionalFees: Number(formData.get("professionalFees")),
    medicineCost: Number(formData.get("medicineCost")),
    otherHospitalExpenses: Number(formData.get("otherHospitalExpenses")),
    packageCharges: Number(formData.get("packageCharges")),
    totalExpectedCost: Number(formData.get("totalExpectedCost")),

    // G. Medical History
    diabetesSince: formData.get("diabetesSince") as string,
    hypertensionSince: formData.get("hypertensionSince") as string,
    heartDiseaseSince: formData.get("heartDiseaseSince") as string,
    hyperlipidemiaSince: formData.get("hyperlipidemiaSince") as string,
    osteoarthritisSince: formData.get("osteoarthritisSince") as string,
    asthmaCopdSince: formData.get("asthmaCopdSince") as string,
    cancerSince: formData.get("cancerSince") as string,
    alcoholDrugAbuseSince: formData.get("alcoholDrugAbuseSince") as string,
    hivSince: formData.get("hivSince") as string,
    otherChronicAilment: formData.get("otherChronicAilment") as string,

    // H. Declarations & Attachments
    patientDeclarationName: formData.get("patientDeclarationName") as string,
    patientDeclarationContact: formData.get("patientDeclarationContact") as string,
    patientDeclarationEmail: formData.get("patientDeclarationEmail") as string,
    patientDeclarationDate: formData.get("patientDeclarationDate") as string,
    patientDeclarationTime: formData.get("patientDeclarationTime") as string,
    hospitalDeclarationDoctorName: formData.get("hospitalDeclarationDoctorName") as string,
    hospitalDeclarationDate: formData.get("hospitalDeclarationDate") as string,
    hospitalDeclarationTime: formData.get("hospitalDeclarationTime") as string,
    attachments: formData.getAll("attachments") as string[],
  };

  try {
    await sendPreAuthEmail(newRequest);
    mockStaffingRequests.push(newRequest);
    return { message: "Request sent successfully", type: 'success' };
  } catch(error) {
      const err = error as Error;
      console.error("Failed to send email:", err);
      return { message: `Failed to send email: ${err.message}`, type: 'error' };
  }
}


export async function handleDeleteRequest(formData: FormData) {
    const id = formData.get("id") as string;
    const index = mockStaffingRequests.findIndex(r => r.id === id);
    if (index > -1) {
        mockStaffingRequests.splice(index, 1);
    }
}
