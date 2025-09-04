
"use client"

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Trash, Edit, Eye, AlertTriangle } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { handleDeleteClaim, getClaims } from "./actions"
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
import type { Claim, ClaimStatus } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


export default function ClaimsPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    // Admins can see all claims, hospital staff see only their hospital's claims
    const hospitalId = role === 'Hospital Staff' ? user?.hospitalId : null;
    
    // Don't try to load if a hospital staff user doesn't have a hospital ID yet
    if (role === 'Hospital Staff' && !user?.hospitalId) {
        setIsLoading(false);
        setError("You are not assigned to a hospital. Please contact an administrator.");
        return;
    }

    setIsLoading(true);
    try {
        const data = await getClaims(hospitalId);
        setClaims(data);
    } catch(err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (user) {
        loadClaims();
    }
  }, [user, loadClaims]);

  const getStatusVariant = (status: ClaimStatus) => {
    switch (status) {
      case 'Paid':
      case 'Settlement Done':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Processing':
      case 'Pending':
      case 'Query Answered':
        return 'secondary';
       case 'Approved':
       case 'Approval':
       case 'Amount Sanctioned':
       case 'Amount Received':
        return 'default'
      default:
        return 'secondary';
    }
  }

  const handleRowClick = (claimId: number) => {
    router.push(`/dashboard/claims/${claimId}/view`);
  };


  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Claim Tracker</CardTitle>
            <CardDescription>Manage and track all submitted claims.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <p>Loading claims...</p>
           ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Claims</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
           ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map(c => (
                <TableRow key={c.id} onClick={() => handleRowClick(c.id)} className="cursor-pointer">
                  <TableCell className="font-mono">{c.claim_id || c.id}</TableCell>
                  <TableCell className="font-medium">{c.Patient_name}</TableCell>
                  <TableCell>{c.hospitalName || 'N/A'}</TableCell>
                  <TableCell>${c.claimAmount?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(c.status)} className={c.status === 'Paid' || c.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>{c.created_by || 'N/A'}</TableCell>
                  <TableCell>{new Date(c.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                           <form action={async (formData) => {
                             await handleDeleteClaim(formData);
                             loadClaims();
                           }}>
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
           )}
        </CardContent>
      </Card>
    </div>
  )
}
