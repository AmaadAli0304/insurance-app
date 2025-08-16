
export type UserRole = 'Admin' | 'Hospital Admin' | 'Hospital Staff' | 'Company Admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
  companyId?: string;
}

export interface Hospital {
  id: string;
  name: string;
  registrationNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address: string;
  contact: string; // Keeping for backward compatibility with admin view for now
  assignedCompanies: string[];
  assignedTPAs?: string[];
  insuranceCoverageLimits?: Record<string, number>;
  servicesOffered?: string[];
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
  registrationNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  policies: Policy[];
  assignedHospitals: string[];
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phoneNumber: string; 
  address: string;
  companyId: string; 
  policyNumber: string; 
  memberId: string;
  policyStartDate: string;
  policyEndDate: string;
  hospitalId: string;
  hospitalCode?: string;
  doctorName: string;
  doctorRegistrationNumber?: string;
  admissionDate: string;
  diagnosis: string;
  proposedTreatment: string;
  estimatedCost: number;
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
  tpaId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  associatedInsuranceCompanies: string[];
  associatedHospitals: string[];
  servicesOffered: string[];
  slaDays: number;
  remarks?: string;
}

export interface Staff {
  id: string;
  fullName: string;
  designation: string;
  department: string;
  contactNumber: string;
  email: string;
  companyId: string;
  joiningDate: string;
  endDate?: string;
  shiftTiming?: string;
  status: 'Active' | 'Inactive';
}
