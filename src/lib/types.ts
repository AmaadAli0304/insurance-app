export type UserRole = 'Admin' | 'Hospital Admin' | 'Hospital Staff' | 'Insurance Company Admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
  insuranceCompanyId?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  contact: string;
  assignedInsuranceCompanies: string[];
}

export interface InsurancePlan {
  planId: string;
  name: string;
  coverageAmount: number;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  contact: string;
  plans: InsurancePlan[];
  assignedHospitals: string[];
}

export interface Patient {
  id: string;
  name: string;
  dob: string; // Date of Birth
  hospitalId: string;
  insuranceCompanyId: string;
  planId: string;
  documents?: string[]; // URLs to documents in Storage
}

export interface Claim {
  id: string;
  patientId: string;
  hospitalId: string;
  insuranceCompanyId: string;
  planId: string;
  claimAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string; // ISO date string
  details: string;
}
