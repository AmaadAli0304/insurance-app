
import type { User, Hospital, Company, Patient, StaffingRequest, StaffingPackage, UserRole } from './types';

export let mockUsers: User[] = [
  { uid: 'admin-01', name: 'Super Admin', email: 'admin@medichain.com', role: 'Admin' },
  { uid: 'hadmin-01', name: 'Alice', email: 'alice@stjude.com', role: 'Hospital Admin', hospitalId: 'hosp-01' },
  { uid: 'hstaff-01', name: 'Bob', email: 'bob@stjude.com', role: 'Hospital Staff', hospitalId: 'hosp-01' },
  { uid: 'cadmin-01', name: 'Charlie', email: 'charlie@statamine.com', role: 'Company Admin', companyId: 'comp-01' },
  { uid: 'hadmin-02', name: 'Diana', email: 'diana@mercy.com', role: 'Hospital Admin', hospitalId: 'hosp-02' },
];

export const mockStaffingPackages: Record<string, StaffingPackage[]> = {
  'comp-01': [
    { packageId: 'stat-gold', name: 'Statamine Gold', monthlyRate: 100000 },
    { packageId: 'stat-silver', name: 'Statamine Silver', monthlyRate: 50000 },
  ],
  'comp-02': [
    { packageId: 'flex-prem', name: 'FlexiStaff Premium', monthlyRate: 250000 },
    { packageId: 'flex-basic', name: 'FlexiStaff Basic', monthlyRate: 75000 },
  ],
};

export let mockHospitals: Hospital[] = [
  { id: 'hosp-01', name: 'St. Jude Children\'s Research Hospital', address: '262 Danny Thomas Pl, Memphis, TN', contact: '901-595-3300', assignedCompanies: ['comp-01'] },
  { id: 'hosp-02', name: 'Mercy General Hospital', address: '4001 J St, Sacramento, CA', contact: '916-453-4444', assignedCompanies: ['comp-01', 'comp-02'] },
];

export let mockCompanies: Company[] = [
  { id: 'comp-01', name: 'Statamine Inc.', contact: '800-786-5433', packages: mockStaffingPackages['comp-01'], assignedHospitals: ['hosp-01', 'hosp-02'] },
  { id: 'comp-02', name: 'FlexiStaff Solutions', contact: '800-393-6130', packages: mockStaffingPackages['comp-02'], assignedHospitals: ['hosp-02'] },
];

export let mockPatients: Patient[] = [
  { id: 'pat-01', fullName: 'John Doe', dateOfBirth: '1985-05-20', gender: 'Male', phoneNumber: '555-123-4567', address: '123 Main St, Anytown, USA', hospitalId: 'hosp-01', companyId: 'comp-01', policyNumber: 'POL-1A2B3C', memberId: 'MEM-XYZ-001', policyStartDate: '2023-01-01', policyEndDate: '2024-01-01', admissionDate: '2023-10-01', diagnosis: 'C81.90', estimatedCost: 5200 },
  { id: 'pat-02', fullName: 'Jane Smith', dateOfBirth: '1992-11-15', gender: 'Female', phoneNumber: '555-987-6543', address: '456 Oak Ave, Anytown, USA', hospitalId: 'hosp-01', companyId: 'comp-01', policyNumber: 'POL-4D5E6F', memberId: 'MEM-XYZ-002', policyStartDate: '2022-06-15', policyEndDate: '2024-06-15', admissionDate: '2023-10-02', diagnosis: 'S82.61XA', estimatedCost: 1250 },
  { id: 'pat-03', fullName: 'Peter Jones', dateOfBirth: '1978-01-30', gender: 'Male', phoneNumber: '555-555-5555', address: '789 Pine Ln, Anytown, USA', hospitalId: 'hosp-02', companyId: 'comp-02', policyNumber: 'POL-7G8H9I', memberId: 'MEM-XYZ-003', policyStartDate: '2023-03-20', policyEndDate: '2025-03-20', admissionDate: '2023-10-03', diagnosis: 'K35.80', estimatedCost: 15000 },
];

export let mockStaffingRequests: StaffingRequest[] = [
  { id: 'req-001', patientId: 'pat-01', hospitalId: 'hosp-01', companyId: 'comp-01', packageId: '27447', requestAmount: 5200, status: 'Pending', createdAt: '2023-10-01T10:00:00Z', details: 'Patient John Doe admitted for cardiovascular observation. Required specialized nurse for 2 days.', doctorName: 'Dr. Emily Carter', doctorSpeciality: 'Cardiologist', proposedTreatment: 'Cardiac Monitoring' },
  { id: 'req-002', patientId: 'pat-02', hospitalId: 'hosp-01', companyId: 'comp-01', packageId: '97110', requestAmount: 1250, status: 'Approved', createdAt: '2023-10-02T11:30:00Z', details: 'Patient Jane Smith required a physical therapist for a minor fracture rehab session.', doctorName: 'Dr. Michael Lee', doctorSpeciality: 'Orthopedic Surgeon', proposedTreatment: 'Physical Therapy' },
  { id: 'req-003', patientId: 'pat-03', hospitalId: 'hosp-02', companyId: 'comp-02', packageId: '44950', requestAmount: 15000, status: 'Pending', createdAt: '2023-10-03T14:00:00Z', details: 'Emergency request for a surgical assistant for an appendectomy. Includes 3-day post-op monitoring.', doctorName: 'Dr. Sarah Chen', doctorSpeciality: 'General Surgeon', proposedTreatment: 'Appendectomy' },
  { id: 'req-004', patientId: 'pat-03', hospitalId: 'hosp-02', companyId: 'comp-02', packageId: '99213', requestAmount: 850, status: 'Rejected', createdAt: '2023-09-25T09:00:00Z', details: 'Request for follow-up consultation. Rejected as post-operative follow-ups are covered under the initial request.', doctorName: 'Dr. Sarah Chen', doctorSpeciality: 'General Surgeon', proposedTreatment: 'Follow-up Consultation' },
];

export const getMockUserByEmail = (email: string): User | null => {
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return null;
  }
  return user;
}
