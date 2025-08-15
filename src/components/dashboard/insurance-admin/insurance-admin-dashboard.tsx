"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { mockClaims, mockPatients, mockInsuranceCompanies } from "@/lib/mock-data"
import type { Claim, Patient } from "@/lib/types";
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { ClaimDetails } from "./claim-details"

export function InsuranceAdminDashboard() {
  const { user } = useAuth();
  const insuranceCompanyId = user?.insuranceCompanyId;

  const company = mockInsuranceCompanies.find(c => c.id === insuranceCompanyId);
  const claims = mockClaims.filter(c => c.insuranceCompanyId === insuranceCompanyId);
  
  const [selectedClaim, setSelectedClaim] = useState<{claim: Claim, patient: Patient} | null>(null);

  const handleViewDetails = (claim: Claim) => {
    const patient = mockPatients.find(p => p.id === claim.patientId);
    if (patient) {
      setSelectedClaim({ claim, patient });
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedClaim(null)}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Insurance Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{claims.filter(c => c.status === 'Pending').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Claims (30d)</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{claims.filter(c => c.status === 'Approved').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Claims (30d)</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{claims.filter(c => c.status === 'Rejected').length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Claims for Review</CardTitle>
              <CardDescription>Review and process pending insurance claims.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{mockPatients.find(p=>p.id === c.patientId)?.name}</TableCell>
                    <TableCell>{c.hospitalId}</TableCell>
                    <TableCell>${c.claimAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'Approved' ? 'default' : c.status === 'Rejected' ? 'destructive' : 'secondary'} className={c.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={() => handleViewDetails(c)}>View Details & AI Summary</DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem className="text-green-600">Approve</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              <CardTitle>Insurance Plans</CardTitle>
              <CardDescription>Manage your company's insurance plans.</CardDescription>
            </div>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Plan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Coverage Amount</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company?.plans.map(p => (
                  <TableRow key={p.planId}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>${p.coverageAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
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
      {selectedClaim && <ClaimDetails claim={selectedClaim.claim} patient={selectedClaim.patient} />}
    </Dialog>
  )
}
