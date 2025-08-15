
"use client"

import { useAuth } from "@/components/auth-provider";
import { mockClaims, mockHospitals, mockInsuranceCompanies, mockPatients } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Clock, AlertTriangle } from "lucide-react";
import { HospitalsTable } from "./hospitals-table";

export function InsuranceAdminDashboard() {
  const { user } = useAuth();
  const insuranceCompanyId = user?.insuranceCompanyId;

  if (!insuranceCompanyId) {
    return <div>Loading...</div>;
  }
  
  const company = mockInsuranceCompanies.find(c => c.id === insuranceCompanyId);
  const claims = mockClaims.filter(c => c.insuranceCompanyId === insuranceCompanyId);
  const assignedHospitals = mockHospitals.filter(h => h.assignedInsuranceCompanies.includes(insuranceCompanyId));
  
  const totalPatientsInNetwork = mockPatients.filter(p => p.insuranceCompanyId === insuranceCompanyId).length;
  const pendingClaims = claims.filter(c => c.status === 'Pending').length;
  const rejectedClaims = claims.filter(c => c.status === 'Rejected').length; // Placeholder for SLA Breaches

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Insurance Dashboard for {company?.name}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{assignedHospitals.length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalPatientsInNetwork}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{pendingClaims}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-500">{rejectedClaims}</div>
            </CardContent>
        </Card>
      </div>
      
      <HospitalsTable 
        hospitals={assignedHospitals} 
        claims={claims} 
        patients={mockPatients}
        insuranceCompanyId={insuranceCompanyId}
       />

    </div>
  )
}
