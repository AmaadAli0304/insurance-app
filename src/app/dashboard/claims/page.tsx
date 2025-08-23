
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Trash, Edit, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { mockClaims, mockPatients, mockHospitals } from "@/lib/mock-data"
import Link from "next/link"
import { handleDeleteClaim } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth-provider"
import type { ClaimStatus } from "@/lib/types"


export default function ClaimsPage() {
  const { user, role } = useAuth();
  const claims = role === 'Company Admin' 
    ? mockClaims.filter(c => c.companyId === user?.companyId)
    : mockClaims.filter(c => c.hospitalId === user?.hospitalId);

  const getPatientName = (patientId: string) => {
    return mockPatients.find(p => p.id === patientId)?.fullName || 'N/A';
  }

  const getHospitalName = (hospitalId: string) => {
    return mockHospitals.find(h => h.id === hospitalId)?.name || 'N/A';
  }
  
  const getStatusVariant = (status: ClaimStatus) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Processing':
      case 'Appealed':
        return 'secondary';
       case 'Approved':
        return 'default'
      default:
        return 'secondary';
    }
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Claim Tracker</CardTitle>
            <CardDescription>Manage and track all submitted claims.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/claims/new">
              <PlusCircle className="h-4 w-4" />
              New Claim
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.id}</TableCell>
                  <TableCell className="font-medium">{getPatientName(c.patientId)}</TableCell>
                  <TableCell>{getHospitalName(c.hospitalId)}</TableCell>
                  <TableCell>${c.claimAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(c.status)} className={c.status === 'Paid' || c.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(c.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                             <Link href={`/dashboard/claims/${c.id}/view`} className="flex items-center gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" /> View Details
                             </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/claims/${c.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                              <Edit className="h-4 w-4" /> Edit Status
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialogTrigger asChild>
                             <DropdownMenuItem className="text-destructive flex items-center gap-2 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                               <Trash className="h-4 w-4" /> Delete
                             </DropdownMenuItem>
                           </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this claim.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <form action={handleDeleteClaim}>
                              <input type="hidden" name="id" value={c.id} />
                              <AlertDialogAction type="submit">Continue</AlertDialogAction>
                           </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
