
"use client"

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Trash, Edit, Eye, AlertTriangle, History, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { handleDeleteClaim, getClaims, getClaimsByPatientId } from "./actions"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"
import type { Claim, ClaimStatus } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function ClaimsPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [historyClaims, setHistoryClaims] = useState<Claim[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState("");

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

  const handleHistoryClick = async (patientId: number, patientName: string) => {
    setIsHistoryLoading(true);
    setSelectedPatientName(patientName);
    setIsHistoryOpen(true);
    try {
        const data = await getClaimsByPatientId(patientId);
        setHistoryClaims(data);
    } catch(err: any) {
        setError("Could not fetch claim history.");
    } finally {
        setIsHistoryLoading(false);
    }
  };

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

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }


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
                <TableHead>Patient</TableHead>
                <TableHead>Claim ID</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map(c => (
                <TableRow key={c.id} onClick={() => handleRowClick(c.id)} className="cursor-pointer">
                   <TableCell className="font-medium flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={c.patientPhoto ?? undefined} alt={c.Patient_name} />
                        <AvatarFallback>{getInitials(c.Patient_name)}</AvatarFallback>
                    </Avatar>
                    {c.Patient_name}
                  </TableCell>
                  <TableCell className="font-mono">{c.claim_id || 'N/A'}</TableCell>
                  <TableCell>{c.hospitalName || 'N/A'}</TableCell>
                  <TableCell>${c.claimAmount?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(c.status)} className={c.status === 'Paid' || c.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>{c.reason || 'N/A'}</TableCell>
                  <TableCell>{new Date(c.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/claims/${c.id}/view`} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4" /> View Details
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleHistoryClick(c.Patient_id, c.Patient_name)} className="flex items-center gap-2 cursor-pointer">
                          <History className="h-4 w-4" /> History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                           <DropdownMenuItem className="text-destructive flex items-center gap-2 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                             <Trash className="h-4 w-4" /> Delete
                           </DropdownMenuItem>
                           </AlertDialogTrigger>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           )}
        </CardContent>
      </Card>
      
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim History for {selectedPatientName}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isHistoryLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
               <ScrollArea className="h-[400px]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {historyClaims.map(claim => (
                            <TableRow key={claim.id}>
                                <TableCell>
                                    <Badge variant={getStatusVariant(claim.status)} className={claim.status === 'Paid' || claim.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}>
                                        {claim.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{claim.reason || 'N/A'}</TableCell>
                                <TableCell>{new Date(claim.updated_at).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
               </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
