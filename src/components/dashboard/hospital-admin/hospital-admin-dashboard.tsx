
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, User, FileText, Users, ArrowRight } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { mockPatients, mockStaffingRequests, mockUsers, mockCompanies } from "@/lib/mock-data"
import Link from "next/link"

export function HospitalAdminDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const patients = mockPatients.filter(p => p.hospitalId === hospitalId);
  const requests = mockStaffingRequests.filter(c => c.hospitalId === hospitalId);
  const staff = mockUsers.filter(u => u.hospitalId === hospitalId && u.role === 'Hospital Staff');

  const getCompanyName = (companyId: string) => {
    return mockCompanies.find(c => c.id === companyId)?.name || 'N/A';
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hospital Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.filter(r => r.status === 'Pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Patients</CardTitle>
            <CardDescription>Manage patient records and staffing details.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/patients">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Staffing Company</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.slice(0, 5).map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.dob}</TableCell>
                  <TableCell>{getCompanyName(p.companyId)}</TableCell>
                  <TableCell>
                     <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/patients/${p.id}/edit`}>
                           <MoreHorizontal className="h-4 w-4" />
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Staffing Requests</CardTitle>
            <CardDescription>Track submitted staffing requests.</CardDescription>
          </div>
           <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Create Request
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.slice(0, 5).map(r => (
                 <TableRow key={r.id}>
                  <TableCell className="font-medium">{mockPatients.find(p=>p.id === r.patientId)?.name}</TableCell>
                  <TableCell>${r.requestAmount.toLocaleString()}</TableCell>
                  <TableCell>
                     <Badge variant={r.status === 'Approved' ? 'default' : r.status === 'Rejected' ? 'destructive' : 'secondary'} className={r.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>{r.status}</Badge>
                  </TableCell>
                   <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem>View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
