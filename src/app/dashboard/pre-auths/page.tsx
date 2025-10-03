
"use client"

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Trash, Eye, Edit, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { handleDeleteRequest, getPreAuthRequests } from "./actions"
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
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import type { StaffingRequest, PreAuthStatus } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function PreAuthsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [requests, setRequests] = useState<StaffingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const loadRequests = useCallback(async () => {
    if (!user?.hospitalId) {
      setIsLoading(false);
      return;
    };
    setIsLoading(true);
    try {
      const { requests: data, total } = await getPreAuthRequests(user.hospitalId, statusFilter, currentPage, itemsPerPage);
      setRequests(data);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.hospitalId, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    if(user) {
      loadRequests();
    }
  }, [user, loadRequests]);


  const handleRowClick = (requestId: string) => {
    router.push(`/dashboard/pre-auths/${requestId}/view`);
  };

  const getStatusVariant = (status: PreAuthStatus) => {
    switch (status) {
      case 'Pre auth Sent':
      case 'Enhancement Request':
        return 'badge-light-blue';
      case 'Query Raised':
        return 'badge-orange';
      case 'Query Answered':
      case 'Enhancement Approval':
        return 'badge-yellow';
      case 'Initial Approval':
      case 'Final Discharge sent':
        return 'badge-light-green';
      case 'Final Approval':
        return 'badge-green';
      case 'Settled':
        return 'badge-purple';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
}

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pre-Authorizations</CardTitle>
            <CardDescription>Manage pre-authorization requests.</CardDescription>
          </div>
           <div className="flex items-center gap-4">
             <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Completed</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                </SelectContent>
            </Select>
            <Button size="sm" className="gap-1" asChild>
                <Link href="/dashboard/pre-auths/new">
                <PlusCircle className="h-4 w-4" />
                New Pre-Auth
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <p>Loading requests...</p>
           ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
           ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Time Ago</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map(r => (
                      <TableRow key={r.id} onClick={() => handleRowClick(r.id)} className="cursor-pointer">
                        <TableCell className="font-medium flex items-center gap-3">
                           <Avatar className="h-10 w-10">
                              <AvatarImage src={r.patientPhoto ?? undefined} alt={r.fullName} />
                              <AvatarFallback>{getInitials(r.fullName!)}</AvatarFallback>
                          </Avatar>
                          {r.fullName}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusVariant(r.status)}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(r.createdAt), 'PPP')}</TableCell>
                        <TableCell>{format(new Date(r.createdAt), 'p')}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                 <DropdownMenuItem asChild>
                                   <Link href={`/dashboard/pre-auths/${r.id}/view`} className="flex items-center gap-2 cursor-pointer">
                                      <Eye className="h-4 w-4" /> View Details
                                   </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                   <Link href={`/dashboard/pre-auths/${r.id}/edit`} className="flex items-center gap-2 cursor-pointer">
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
                                  This action cannot be undone. This will permanently delete the request.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <form action={async (formData) => {
                                   await handleDeleteRequest(formData);
                                   loadRequests();
                                 }}>
                                    <input type="hidden" name="id" value={r.id} />
                                    <AlertDialogAction type="submit">Continue</AlertDialogAction>
                                 </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Data not found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
            </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}
