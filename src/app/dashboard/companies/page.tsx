
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { CompaniesTable } from "./companies-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Company } from "@/lib/types";


export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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
            <p>Loading companies...</p>
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
            <CompaniesTable companies={companies} onCompanyDeleted={fetchCompanies} />
           )}
        </CardContent>
      </Card>
    </div>
  )
}
