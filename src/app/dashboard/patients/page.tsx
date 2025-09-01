
"use client"

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getPatients } from "./actions"
import { PatientsTable } from "./patients-table"
import type { Patient } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider";

export default function PatientsPage() {
  const { user, role } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pass the hospitalId only if the user is hospital staff
      const hospitalId = role === 'Hospital Staff' ? user?.hospitalId : null;
      const patientData = await getPatients(hospitalId);
      setPatients(patientData);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (user) { // Only load patients if user is available
      loadPatients();
    }
  }, [loadPatients, user]);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Patients</CardTitle>
            <CardDescription>Manage patient records and their assigned insurance details.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/patients/new">
              <PlusCircle className="h-4 w-4" />
              Add Patient
            </Link>
          </Button>
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
            <PatientsTable patients={patients} onPatientDeleted={loadPatients} />
           )}
        </CardContent>
      </Card>
    </div>
  )
}
