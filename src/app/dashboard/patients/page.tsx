
"use client"

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getPatients } from "./actions"
import { PatientsTable } from "./patients-table"
import type { Patient } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export default function PatientsPage() {
  const { user, role } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive'>('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const hospitalId = role === 'Hospital Staff' ? user?.hospitalId : null;
      const { patients: patientData, total } = await getPatients(hospitalId, statusFilter, debouncedSearchQuery, currentPage, itemsPerPage);
      setPatients(patientData);
      setTotalPages(Math.ceil(total / itemsPerPage));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, statusFilter, debouncedSearchQuery, currentPage, itemsPerPage]);

  useEffect(() => {
    if (user) { 
      loadPatients();
    }
  }, [loadPatients, user]);
  
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
            <CardTitle>Patients</CardTitle>
            <CardDescription>Manage patient records and their assigned insurance details.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-64">
                <Input 
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'Active' | 'Inactive')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Completed</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <Button size="sm" className="gap-1" asChild>
              <Link href="/dashboard/patients/new">
                <PlusCircle className="h-4 w-4" />
                Add Patient
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <p>Loading patients...</p>
           ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Patients</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
           ) : (
            <>
              <PatientsTable patients={patients} onPatientDeleted={loadPatients} />
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
