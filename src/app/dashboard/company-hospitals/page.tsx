
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getHospitals } from "./actions"
import { HospitalsTable } from "./hospitals-table"
import type { Hospital } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CompanyHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHospitals = useCallback(async () => {
    setIsLoading(true);
    try {
      const hospitalData = await getHospitals();
      setHospitals(hospitalData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hospitals</CardTitle>
            <CardDescription>Manage hospitals your company is associated with.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/company-hospitals/new">
              <PlusCircle className="h-4 w-4" />
              Add Hospital
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <p>Loading hospitals...</p>
           ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Hospitals</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
           ) : (
            <HospitalsTable hospitals={hospitals} onHospitalDeleted={loadHospitals} />
           )}
        </CardContent>
      </Card>
    </div>
  )
}
