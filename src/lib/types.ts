
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
  address: string;
  contact: string;
  assignedCompanies: string[];
}

export interface StaffingPackage {
  packageId: string;
  name: string;
  monthlyRate: number;
}

export interface Company {
  id: string;
  name: string;
  contact: string;
  packages: StaffingPackage[];
  assignedHospitals: string[];
}

export interface Patient {
  id: string;
  name: string;
  dob: string; // Date of Birth
  hospitalId: string;
  companyId: string;
  packageId: string;
  documents?: string[]; // URLs to documents in Storage
}

export interface StaffingRequest {
  id: string;
  patientId: string;
  hospitalId: string;
  companyId: string;
  packageId: string;
  requestAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string; // ISO date string
  details: string;
}
