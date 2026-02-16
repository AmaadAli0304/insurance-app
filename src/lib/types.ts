

import { Complaint } from "@/components/chief-complaint-form";

export type UserRole = 'Admin' | 'Hospital Staff' | 'Company Admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId?: string | null;
  hospitalName?: string | null;
  companyId?: string;
  password?: string;
  designation?: string | null;
  department?: string | null;
  joiningDate?: string | null;
  endDate?: string | null;
  shiftTime?: string | null;
  status?: 'Active' | 'Inactive' | null;
  number?: string | null;
  photo?: string | null;
  salary?: number | null;
}

export interface Hospital {
  id: string;
  name:string;
  location?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  photo?: string | null;
  archived?: boolean | null;
  mailtrap_token?: string | null;
  contact?: string; // Keeping for backward compatibility with admin view for now
  assignedCompanies: string[];
  assignedTPAs?: string[];
  assignedStaff?: string[];
  insuranceCoverageLimits?: Record<string, number>;
}

export interface Policy {
  policyId: string;
  policyName: string;
  coverageAmount: number;
  conditions?: string;
}

export interface Company {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  portalLink?: string;
  assignedHospitals: string[];
  assignedHospitalsDetails?: { id: string, name: string }[];
  policies: Policy[];
}

export interface Patient {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  email_address: string;
  phoneNumber?: string | null; 
  alternative_number?: string | null;
  age?: number | null;
  occupation?: string | null;
  employee_id?: string | null;
  abha_id?: string | null;
  health_id?: string | null;
  address?: string | null;
  companyId: string;
  companyName?: string; 
  tpaName?: string;
  tpaEmail?: string;
  policyNumber?: string | null; 
  memberId?: string | null;
  policyStartDate?: string | null;
  policyEndDate?: string | null;
  sumInsured?: number | null;
  sumUtilized?: number | null;
  totalSum?: number | null;
  photo?: { url: string; name: string; } | string | null;
  adhaar_path?: { url: string; name: string; } | string | null;
  pan_path?: { url: string; name: string; } | string | null;
  passport_path?: { url: string; name: string; } | string | null;
  voter_id_path?: { url: string; name: string; } | string | null;
  driving_licence_path?: { url: string; name: string; } | string | null;
  other_path?: { url: string; name: string; } | string | null;
  policy_path?: { url: string; name: string; } | string | null;
  discharge_summary_path?: { url: string; name: string; } | string | null;
  final_bill_path?: { url: string; name: string; } | string | null;
  pharmacy_bill_path?: { url: string; name: string; } | string | null;
  implant_bill_stickers_path?: { url: string; name: string; } | string | null;
  lab_bill_path?: { url: string; name: string; } | string | null;
  ot_anesthesia_notes_path?: { url: string; name: string; } | string | null;
  status?: 'Active' | 'Inactive' | null;

  // Admission fields
  admission_id?: string;
  admission_db_id?: number;
  relationship_policyholder?: string;
  corporate_policy_number?: string;
  other_policy_name?: string;
  family_doctor_name?: string;
  family_doctor_phone?: string;
  payer_email?: string;
  payer_phone?: string;
  tpa_id?: number;
  treat_doc_name?: string;
  treat_doc_number?: string;
  treat_doc_qualification?: string;
  treat_doc_reg_no?: string;

   // Clinical Information
  natureOfIllness?: string;
  clinicalFindings?: string;
  ailmentDuration?: number;
  firstConsultationDate?: string;
  pastHistory?: string;
  provisionalDiagnosis?: string;
  icd10Codes?: string;
  treatmentMedical?: string;
  treatmentSurgical?: string;
  treatmentIntensiveCare?: string;
  treatmentInvestigation?: string;
  treatmentNonAllopathic?: string;
  investigationDetails?: string;
  drugRoute?: string;
  procedureName?: string;
  icd10PcsCodes?: string;
  otherTreatments?: string;

  // Accident / Medico-Legal
  isInjury?: boolean;
  injuryCause?: string;
  isRta?: boolean;
  injuryDate?: string;
  isReportedToPolice?: boolean;
  firNumber?: string;
  isAlcoholSuspected?: boolean;
  isToxicologyConducted?: boolean;

  // Maternity
  isMaternity?: boolean;
  g?: number;
  p?: number;
  l?: number;
  a?: number;
  expectedDeliveryDate?: string;

  // Admission & Cost Estimate
  admissionDate?: string;
  admissionTime?: string;
  admissionType?: string;
  expectedStay?: number;
  expectedIcuStay?: number;
  roomCategory?: string;
  roomNursingDietCost?: number;
  investigationCost?: number;
  icuCost?: number;
  otCost?: number;
  professionalFees?: number;
  medicineCost?: number;
  otherHospitalExpenses?: number;
  packageCharges?: number;
  totalExpectedCost?: number;

  // Medical History
  complaints?: Complaint[];

  // Declarations & Attachments
  patientDeclarationName?: string;
  patientDeclarationContact?: string;
  patientDeclarationEmail?: string;
  patientDeclarationDate?: string;
  patientDeclarationTime?: string;
  hospitalDeclarationDoctorName?: string;
  hospitalDeclarationDate?: string;
  hospitalDeclarationTime?: string;
  attachments?: string[];

  // Deprecated fields, kept for mock data compatibility
  hospitalId?: string;
  hospitalCode?: string;
  doctorName?: string;
  doctorRegistrationNumber?: string;
  diagnosis?: string;
  proposedTreatment?: string;
  estimatedCost?: number;
  expectedLengthOfStay?: number; // in days
  doctorSpeciality?: string;
  expectedDischargeDate?: string;
  procedureCode?: string;
  clinicalNotes?: string;
  doctor_id?: number;
}


export type PreAuthStatus =
  | 'Pending'
  | 'Query Raised'
  | 'Query Answered'
  | 'Initial Approval Amount'
  | 'Approval'
  | 'Amount Sanctioned'
  | 'Initial Approval'
  | 'Settlement Done'
  | 'Rejected'
  | 'Draft'
  | 'Approved' // Kept for backwards compatibility
  | 'Enhancement Request'
  | 'Enhancement Approval'
  | 'Final Discharge sent'
  | 'Final Approval'
  | 'Initial Approval'
  | 'Pre auth Sent'
  | 'Settled'
  | 'Settlement Pending'
  | 'Settlement Query'
  | 'Settlement Answered';

export interface ChatMessage {
  id: number;
  preauth_id: number;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  request_type: string;
  created_at: string;
  attachments?: { name: string, url: string }[];
}

export interface PodDetails {
  id: number;
  preauth_id: number;
  pod_type: string;
  pod_number: string;
  courier_name: string;
  date_of_sent: string;
  pod_copy_url: string;
  screenshot_url: string;
  ref_no: string;
  email_body: string;
  created_at: string;
  created_by: string;
}

export interface StaffingRequest {
  id: string;
  patientId: string;
  hospitalId?: string | null;
  companyId?: string | null;
  status: PreAuthStatus;
  createdAt: string; // ISO date string
  details: string; 
  subject: string;
  email: string; // "To" email
  fromEmail?: string;
  requestAmount?: number; 
  claim_id?: string | null;
  amount_sanctioned?: number;
  latestSanctionedAmount?: number | null;
  reason?: string;
  patientPhoto?: string | null;
  chatHistory?: ChatMessage[];
  claimsHistory?: Claim[];
  podDetails?: PodDetails | null;
  
  // Patient and admission details snapshot
  fullName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  email_address?: string;
  phoneNumber?: string | null;
  alternative_number?: string | null;
  age?: number | null;
  occupation?: string | null;
  employee_id?: string | null;
  abha_id?: string | null;
  health_id?: string | null;
  address?: string | null;
  policyNumber?: string | null;
  memberId?: string | null;
  policyStartDate?: string | null;
  policyEndDate?: string | null;
  sumInsured?: number | null;
  sumUtilized?: number | null;
  totalSum?: number | null;
  admission_id?: string;
  relationship_policyholder?: string;
  corporate_policy_number?: string;
  other_policy_name?: string;
  family_doctor_name?: string;
  family_doctor_phone?: string;
  payer_email?: string;
  payer_phone?: string;
  hospitalName?: string;
  companyName?: string;
  tpaEmail?: string;
  treat_doc_name?: string;
  treat_doc_number?: string;
  treat_doc_qualification?: string;
  treat_doc_reg_no?: string;

  adhaar_path?: { url: string; name: string; } | string | null;
  pan_path?: { url: string; name: string; } | string | null;
  passport_path?: { url: string; name: string; } | string | null;
  voter_id_path?: { url: string; name: string; } | string | null;
  driving_licence_path?: { url: string; name: string; } | string | null;
  other_path?: { url: string; name: string; } | string | null;
  policy_path?: { url: string; name: string; } | string | null;
  discharge_summary_path?: { url: string; name: string; } | string | null;
  final_bill_path?: { url: string; name: string; } | string | null;
  pharmacy_bill_path?: { url: string; name: string; } | string | null;
  implant_bill_stickers_path?: { url: string; name: string; } | string | null;
  lab_bill_path?: { url: string; name: string; } | string | null;
  ot_anesthesia_notes_path?: { url: string; name: string; } | string | null;

  // C. Clinical Information
  natureOfIllness?: string;
  clinicalFindings?: string;
  ailmentDuration?: number;
  firstConsultationDate?: string;
  pastHistory?: string;
  provisionalDiagnosis?: string;
  icd10Codes?: string;
  treatmentMedical?: string;
  treatmentSurgical?: string;
  treatmentIntensiveCare?: string;
  treatmentInvestigation?: string;
  treatmentNonAllopathic?: string;
  investigationDetails?: string;
  drugRoute?: string;
  procedureName?: string;
  icd10PcsCodes?: string;
  otherTreatments?: string;

  // D. Accident / Medico-Legal
  isInjury?: boolean;
  injuryCause?: string;
  isRta?: boolean;
  injuryDate?: string;
  isReportedToPolice?: boolean;
  firNumber?: string;
  isAlcoholSuspected?: boolean;
  isToxicologyConducted?: boolean;

  // E. Maternity
  isMaternity?: boolean;
  g?: number;
  p?: number;
  l?: number;
  a?: number;
  expectedDeliveryDate?: string;

  // F. Admission & Cost Estimate
  admissionDate?: string;
  admissionTime?: string;
  admissionType?: string;
  expectedStay?: number;
  expectedIcuStay?: number;
  roomCategory?: string;
  roomNursingDietCost?: number;
  investigationCost?: number;
  icuCost?: number;
  otCost?: number;
  professionalFees?: number;
  medicineCost?: number;
  otherHospitalExpenses?: number;
  packageCharges?: number;
  totalExpectedCost?: number;

  // G. Medical History
  diabetesSince?: string;
  hypertensionSince?: string;
  heartDiseaseSince?: string;
  hyperlipidemiaSince?: string;
  osteoarthritisSince?: string;
  asthmaCopdSince?: string;
  cancerSince?: string;
  alcoholDrugAbuseSince?: string;
  hivSince?: string;
  otherChronicAilment?: string;

  // H. Declarations & Attachments
  patientDeclarationName?: string;
  patientDeclarationContact?: string;
  patientDeclarationEmail?: string;
  patientDeclarationDate?: string;
  patientDeclarationTime?: string;
  hospitalDeclarationDoctorName?: string;
  hospitalDeclarationDate?: string;
  hospitalDeclarationTime?: string;
  attachments?: string[];

  // Deprecated fields, kept for mock data compatibility for now
  packageId?: string; 
  doctorSpeciality?: string;
  expectedDischargeDate?: string;
  doctorName?: string;
  proposedTreatment?: string;
}

export type ClaimStatus = 'Processing' | 'Approved' | 'Paid' | 'Rejected' | 'Appealed' | 'Pending' | 'Query Raised' | 'Query Answered' | 'Initial Approval Amount' | 'Amount Sanctioned' | 'Initial Approval' | 'Settlement Done' | 'Pre auth Sent' | 'Final Discharge sent' | 'Final Approval' | 'Settled';
export interface Claim {
  id: number;
  claim_id?: string | null;
  Patient_id: number;
  Patient_name: string;
  patientPhoto?: string | null;
  admission_id?: string | null;
  status: ClaimStatus;
  reason?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  amount?: number;
  final_bill?: number;
  hospital_discount?: number;
  nm_deductions?: number;
  co_pay?: number;
  final_amount?: number;
  final_settle_amount?: number;
  tds?: number;
  pharmacy_bill?: number;
  lab_bill?: number;
  ct_scan_charges?: number;
  mri_charges?: number;
  usg_charges?: number;
  other_charges?: number;
  xray_charges?: number;
  mou_discount?: number;
  preauthId?: number;
  amountPaidByInsured?: number;
  finalAuthorisedAmount?: number;
  initialBilledAmount?: number;
  
  // Joined properties
  hospitalName?: string;
  claimAmount?: number;
  paidAmount?: number;
  companyName?: string;
}

export interface TPA {
  id?: number; // from DB (identity)
  tpaId: string; // for mock data compatibility
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  portalLink?: string;
  assignedHospitalsDetails?: { id: string, name: string }[];
}

export interface Staff extends Omit<User, 'uid' | 'role' | 'companyId'> {
  id: string; // This will map to the 'uid' from the User object
  hospitalName?: string;
  assignedHospitalsDetails?: { id: string | number, name: string }[];
}

export interface CompanySettings {
  name?: string;
  address?: string;
  gst_no?: string;
  pan_no?: string;
  contact_no?: string;
  banking_details?: string;
  account_name?: string;
  bank_name?: string;
  branch?: string;
  account_no?: string;
  ifsc_code?: string;
}

export interface Invoice {
    id: number;
    to: string; // Hospital Name
    hospital: string; // Hospital ID
    address: string; // This is the company address for billing from
    hospitalAddress?: string; // This is the hospital's address for billing to
    hospitalContactPerson?: string;
    hospitalPhone?: string;
    hospitalEmail?: string;
    period: string;
    contract_type: string;
    service_provided: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    ifsc_code: string;
    branch: string;
    staff_id: string;
    staffName?: string; // from join
    companyId?: string; // from join on users
    companySettings?: CompanySettings; // from company_settings table
    created_at: string;
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description: string;
    qty: number;
    rate: number;
    amount: number;
}
