
import type { User, Hospital, Company, Patient, StaffingRequest, StaffingPackage, Claim } from './types';

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
  { id: 'pat-01', fullName: 'John Doe', dateOfBirth: '1985-05-20', gender: 'Male', phoneNumber: '555-123-4567', address: '123 Main St, Anytown, USA', hospitalId: 'hosp-01', hospitalCode: 'STJ-MEM', doctorName: 'Dr. Emily Carter', doctorRegistrationNumber: 'DN-12345', companyId: 'comp-01', policyNumber: 'POL-1A2B3C', memberId: 'MEM-XYZ-001', policyStartDate: '2023-01-01', policyEndDate: '2024-01-01', admissionDate: '2023-10-01', diagnosis: 'C81.90', proposedTreatment: 'Cardiac Monitoring', estimatedCost: 5200, expectedLengthOfStay: 2, doctorSpeciality: 'Cardiologist', clinicalNotes: 'Patient has a history of arrhythmia.' },
  { id: 'pat-02', fullName: 'Jane Smith', dateOfBirth: '1992-11-15', gender: 'Female', phoneNumber: '555-987-6543', address: '456 Oak Ave, Anytown, USA', hospitalId: 'hosp-01', hospitalCode: 'STJ-MEM', doctorName: 'Dr. Michael Lee', doctorRegistrationNumber: 'DN-67890', companyId: 'comp-01', policyNumber: 'POL-4D5E6F', memberId: 'MEM-XYZ-002', policyStartDate: '2022-06-15', policyEndDate: '2024-06-15', admissionDate: '2023-10-02', diagnosis: 'S82.61XA', proposedTreatment: 'Physical Therapy', estimatedCost: 1250, expectedLengthOfStay: 5, doctorSpeciality: 'Orthopedic Surgeon', clinicalNotes: 'Post-operative rehabilitation needed.' },
  { id: 'pat-03', fullName: 'Peter Jones', dateOfBirth: '1978-01-30', gender: 'Male', phoneNumber: '555-555-5555', address: '789 Pine Ln, Anytown, USA', hospitalId: 'hosp-02', hospitalCode: 'MGH-SAC', doctorName: 'Dr. Sarah Chen', doctorRegistrationNumber: 'DN-54321', companyId: 'comp-02', policyNumber: 'POL-7G8H9I', memberId: 'MEM-XYZ-003', policyStartDate: '2023-03-20', policyEndDate: '2025-03-20', admissionDate: '2023-10-03', diagnosis: 'K35.80', proposedTreatment: 'Appendectomy', estimatedCost: 15000, expectedLengthOfStay: 3, doctorSpeciality: 'General Surgeon', clinicalNotes: 'Acute appendicitis, requires immediate surgery.' },
];

export let mockStaffingRequests: StaffingRequest[] = [
  { id: 'req-001', patientId: 'pat-01', hospitalId: 'hosp-01', companyId: 'comp-01', status: 'Pending', createdAt: '2023-10-01T10:00:00Z', details: 'Patient John Doe admitted for cardiovascular observation. Required specialized nurse for 2 days.', subject: 'Urgent: Cardiac Nurse for John Doe', email: 'claims@statamine.com', fromEmail: 'bob@stjude.com' },
  { id: 'req-002', patientId: 'pat-02', hospitalId: 'hosp-01', companyId: 'comp-01', status: 'Approved', createdAt: '2023-10-02T11:30:00Z', details: 'Patient Jane Smith required a physical therapist for a minor fracture rehab session.', subject: 'Physical Therapy for Jane Smith', email: 'claims@statamine.com', fromEmail: 'bob@stjude.com' },
  { id: 'req-003', patientId: 'pat-03', hospitalId: 'hosp-02', companyId: 'comp-02', status: 'Pending', createdAt: '2023-10-03T14:00:00Z', details: 'Emergency request for a surgical assistant for an appendectomy. Includes 3-day post-op monitoring.', subject: 'Emergency Appendectomy - P. Jones', email: 'claims@flexistaff.com', fromEmail: 'staff@mercy.com' },
  { id: 'req-004', patientId: 'pat-03', hospitalId: 'hosp-02', companyId: 'comp-02', status: 'Rejected', createdAt: '2023-09-25T09:00:00Z', details: 'Request for follow-up consultation. Rejected as post-operative follow-ups are covered under the initial request.', subject: 'Follow-up for P. Jones', email: 'claims@flexistaff.com', fromEmail: 'staff@mercy.com' },
];

export let mockClaims: Claim[] = [
    { id: 'claim-001', requestId: 'req-002', patientId: 'pat-02', hospitalId: 'hosp-01', companyId: 'comp-01', claimAmount: 1250, paidAmount: 1200, status: 'Paid', submittedAt: '2023-10-05T09:00:00Z', updatedAt: '2023-10-10T15:30:00Z', notes: 'Paid after deductible.' },
    { id: 'claim-002', requestId: 'req-004', patientId: 'pat-03', hospitalId: 'hosp-02', companyId: 'comp-02', claimAmount: 200, status: 'Rejected', submittedAt: '2023-09-26T11:00:00Z', updatedAt: '2023-09-28T16:00:00Z', notes: 'Duplicate claim. Service covered under initial surgery.' },
];

export const getMockUserByEmail = (email: string): User | null => {
  return mockUsers.find(u => u.email === email) ?? null;
}
