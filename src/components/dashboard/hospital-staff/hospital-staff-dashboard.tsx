
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, Clock, AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { mockPatients, mockStaffingRequests } from "@/lib/mock-data"
import { StatCard } from "@/components/dashboard/stat-card"

export function HospitalStaffDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const requests = mockStaffingRequests.filter(r => r.hospitalId === hospitalId);
  const patients = mockPatients.filter(p => p.hospitalId === hospitalId);
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  
  // Using a placeholder for rejected requests as SLA Breaches
  const slaBreaches = requests.filter(r => r.status === 'Rejected').length;

  const getPatientName = (id: string) => mockPatients.find(p => p.id === id)?.name || 'Unknown Patient';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        {/* Placeholder for search bar if needed in the future */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Live Patients"
          value={patients.length}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Clock}
          color="bg-teal-500"
        />
        <StatCard
          title="Total Requests"
          value={requests.length}
          icon={FileText}
          color="bg-slate-800"
          isCurrency={false}
        />
        <StatCard
          title="SLA Breaches"
          value={slaBreaches}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Submitted Requests</CardTitle>
          <CardDescription>Track the status of staffing requests you have submitted.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Request ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(request => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{getPatientName(request.patientId)}</TableCell>
                  <TableCell>${request.requestAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'Approved' ? 'default' : request.status === 'Rejected' ? 'destructive' : 'secondary'} className={request.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>{request.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{request.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
