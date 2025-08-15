
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
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phoneNumber: string; // Contact Information
  address: string;
  companyId: string; // "Insurance Company"
  policyNumber: string; // Insurance Policy Number
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
  doctorName: string;
  proposedTreatment: string;
  subject?: string;
  email?: string; // "To" email
  fromEmail?: string; // "From" email
  doctorSpeciality?: string;
  expectedDischargeDate?: string;
}
