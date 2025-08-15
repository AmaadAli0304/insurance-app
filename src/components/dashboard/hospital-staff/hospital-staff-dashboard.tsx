"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, PlusCircle, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { mockPatients, mockClaims } from "@/lib/mock-data"

export function HospitalStaffDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const claims = mockClaims.filter(c => c.hospitalId === hospitalId);
  const getPatientName = (id: string) => mockPatients.find(p => p.id === id)?.name || 'Unknown Patient';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.name}!</CardTitle>
          <CardDescription>Here you can register new patients and submit their insurance claims.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button size="lg" className="gap-2">
            <Users className="h-5 w-5" />
            Register a New Patient
          </Button>
          <Button size="lg" variant="secondary" className="gap-2">
            <FileText className="h-5 w-5" />
            Submit a New Claim
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Submitted Claims</CardTitle>
            <CardDescription>Track the status of insurance claims you have submitted.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map(claim => (
                <TableRow key={claim.id}>
                  <TableCell className="font-mono text-xs">{claim.id}</TableCell>
                  <TableCell className="font-medium">{getPatientName(claim.patientId)}</TableCell>
                  <TableCell>${claim.claimAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={claim.status === 'Approved' ? 'default' : claim.status === 'Rejected' ? 'destructive' : 'secondary'} className={claim.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>{claim.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
