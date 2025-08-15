import type { User, Hospital, InsuranceCompany, Patient, Claim, InsurancePlan, UserRole } from './types';

export const mockUsers: User[] = [
  { uid: 'admin-01', name: 'Super Admin', email: 'admin@medichain.com', role: 'Admin' },
  { uid: 'hadmin-01', name: 'Alice', email: 'alice@stjude.com', role: 'Hospital Admin', hospitalId: 'hosp-01' },
  { uid: 'hstaff-01', name: 'Bob', email: 'bob@stjude.com', role: 'Hospital Staff', hospitalId: 'hosp-01' },
  { uid: 'iadmin-01', name: 'Charlie', email: 'charlie@sunlife.com', role: 'Insurance Company Admin', insuranceCompanyId: 'ins-01' },
  { uid: 'hadmin-02', name: 'Diana', email: 'diana@mercy.com', role: 'Hospital Admin', hospitalId: 'hosp-02' },
];

export const mockInsurancePlans: Record<string, InsurancePlan[]> = {
  'ins-01': [
    { planId: 'sun-gold', name: 'SunLife Gold', coverageAmount: 100000 },
    { planId: 'sun-silver', name: 'SunLife Silver', coverageAmount: 50000 },
  ],
  'ins-02': [
    { planId: 'blue-prem', name: 'BlueShield Premium', coverageAmount: 250000 },
    { planId: 'blue-basic', name: 'BlueShield Basic', coverageAmount: 75000 },
  ],
};

export const mockHospitals: Hospital[] = [
  { id: 'hosp-01', name: 'St. Jude Children\'s Research Hospital', address: '262 Danny Thomas Pl, Memphis, TN', contact: '901-595-3300', assignedInsuranceCompanies: ['ins-01'] },
  { id: 'hosp-02', name: 'Mercy General Hospital', address: '4001 J St, Sacramento, CA', contact: '916-453-4444', assignedInsuranceCompanies: ['ins-01', 'ins-02'] },
];

export const mockInsuranceCompanies: InsuranceCompany[] = [
  { id: 'ins-01', name: 'SunLife Assurance', contact: '800-786-5433', plans: mockInsurancePlans['ins-01'], assignedHospitals: ['hosp-01', 'hosp-02'] },
  { id: 'ins-02', name: 'BlueShield of California', contact: '800-393-6130', plans: mockInsurancePlans['ins-02'], assignedHospitals: ['hosp-02'] },
];

export const mockPatients: Patient[] = [
  { id: 'pat-01', name: 'John Doe', dob: '1985-05-20', hospitalId: 'hosp-01', insuranceCompanyId: 'ins-01', planId: 'sun-gold' },
  { id: 'pat-02', name: 'Jane Smith', dob: '1992-11-15', hospitalId: 'hosp-01', insuranceCompanyId: 'ins-01', planId: 'sun-silver' },
  { id: 'pat-03', name: 'Peter Jones', dob: '1978-01-30', hospitalId: 'hosp-02', insuranceCompanyId: 'ins-02', planId: 'blue-prem' },
];

export const mockClaims: Claim[] = [
  { id: 'claim-001', patientId: 'pat-01', hospitalId: 'hosp-01', insuranceCompanyId: 'ins-01', planId: 'sun-gold', claimAmount: 5200, status: 'Pending', createdAt: '2023-10-01T10:00:00Z', details: 'Patient John Doe admitted for cardiovascular observation for 2 days. Required ECG, blood tests, and consultation with a cardiologist. All procedures were standard.' },
  { id: 'claim-002', patientId: 'pat-02', hospitalId: 'hosp-01', insuranceCompanyId: 'ins-01', planId: 'sun-silver', claimAmount: 1250, status: 'Approved', createdAt: '2023-10-02T11:30:00Z', details: 'Patient Jane Smith presented with a minor fracture in the left wrist. X-ray was performed and a cast was applied. Discharged same day.' },
  { id: 'claim-003', patientId: 'pat-03', hospitalId: 'hosp-02', insuranceCompanyId: 'ins-02', planId: 'blue-prem', claimAmount: 15000, status: 'Pending', createdAt: '2023-10-03T14:00:00Z', details: 'Patient Peter Jones underwent an emergency appendectomy. The surgery was successful with no complications. Includes 3-day hospital stay for recovery.' },
  { id: 'claim-004', patientId: 'pat-03', hospitalId: 'hosp-02', insuranceCompanyId: 'ins-02', planId: 'blue-prem', claimAmount: 850, status: 'Rejected', createdAt: '2023-09-25T09:00:00Z', details: 'Claim for follow-up consultation regarding appendectomy. Rejected as post-operative follow-ups within 30 days are covered under the initial surgery cost.' },
];

export const getMockUser = (role: UserRole): User => {
  const user = mockUsers.find(u => u.role === role);
  if (!user) {
    return mockUsers[0]; // Default to admin
  }
  return user;
}
