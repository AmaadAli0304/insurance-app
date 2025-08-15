
"use client"

import { useAuth } from "@/components/auth-provider";
import { mockStaffingRequests, mockHospitals, mockCompanies, mockPatients } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Clock, AlertTriangle } from "lucide-react";
import { HospitalsTable } from "./hospitals-table";

export function CompanyAdminDashboard() {
  const { user } = useAuth();
  const companyId = user?.companyId;

  if (!companyId) {
    return <div>Loading...</div>;
  }
  
  const company = mockCompanies.find(c => c.id === companyId);
  const requests = mockStaffingRequests.filter(r => r.companyId === companyId);
  const assignedHospitals = mockHospitals.filter(h => h.assignedCompanies.includes(companyId));
  
  const totalPatientsInNetwork = mockPatients.filter(p => p.companyId === companyId).length;
  const pendingRequests = requests.filter(c => c.status === 'Pending').length;
  const rejectedRequests = requests.filter(c => c.status === 'Rejected').length; // Placeholder for SLA Breaches

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staffing Dashboard for {company?.name}</h1>

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
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{pendingRequests}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-500">{rejectedRequests}</div>
            </CardContent>
        </Card>
      </div>
      
      <HospitalsTable 
        hospitals={assignedHospitals} 
        requests={requests} 
        patients={mockPatients}
        companyId={companyId}
       />

    </div>
  )
}
