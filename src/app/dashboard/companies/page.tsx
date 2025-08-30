
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { CompaniesTable } from "./companies-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Company } from "@/lib/types";


export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/companies?page=${currentPage}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data.companies);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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
            <CardTitle>Insurance Companies</CardTitle>
            <CardDescription>Manage insurance company profiles and their policies.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/companies/new">
              <PlusCircle className="h-4 w-4" />
              Add Company
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="text-center p-8">Loading companies...</div>
           ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Companies</AlertTitle>
                <AlertDescription>
                  {error}
                  <p className="mt-2 text-xs">Please ensure your database is running and the connection details in your .env file are correct. Check the server logs for more details.</p>
                </AlertDescription>
              </Alert>
           ) : (
             <>
              <CompaniesTable companies={companies} onCompanyDeleted={fetchCompanies} />
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
