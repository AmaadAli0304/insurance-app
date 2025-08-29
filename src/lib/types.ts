

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
}

export interface Hospital {
  id: string;
  name:string;
  location?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
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
  policyNumber?: string | null; 
  memberId?: string | null;
  policyStartDate?: string | null;
  policyEndDate?: string | null;
  photo?: { url: string; name: string; } | string | null;
  adhaar_path?: { url: string; name: string; } | string | null;
  pan_path?: { url: string; name: string; } | string | null;
  passport_path?: { url: string; name: string; } | string | null;
  voter_id_path?: { url: string; name: string; } | string | null;
  driving_licence_path?: { url: string; name: string; } | string | null;
  other_path?: { url: string; name: string; } | string | null;

  // Admission fields
  admission_id?: string;
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


  // Deprecated fields, kept for mock data compatibility
  hospitalId?: string;
  hospitalCode?: string;
  doctorName?: string;
  doctorRegistrationNumber?: string;
  admissionDate?: string;
  diagnosis?: string;
  proposedTreatment?: string;
  estimatedCost?: number;
  expectedLengthOfStay?: number; // in days
  doctorSpeciality?: string;
  expectedDischargeDate?: string;
  procedureCode?: string;
  clinicalNotes?: string;
}


export interface StaffingRequest {
  id: string;
  patientId: string;
  hospitalId: string;
  companyId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string; // ISO date string
  details: string; 
  subject: string;
  email: string; // "To" email
  fromEmail?: string;
  // Deprecated fields, kept for mock data compatibility for now
  packageId?: string; 
  requestAmount?: number; 
  doctorName?: string;
  proposedTreatment?: string;
  doctorSpeciality?: string;
  expectedDischargeDate?: string;
}

export type ClaimStatus = 'Processing' | 'Approved' | 'Paid' | 'Rejected' | 'Appealed';
export interface Claim {
  id: string;
  requestId: string; // Corresponds to the initial pre-auth request
  patientId: string;
  hospitalId: string;
  companyId: string;
  claimAmount: number;
  paidAmount?: number;
  status: ClaimStatus;
  submittedAt: string;
  updatedAt: string;
  notes?: string;
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
