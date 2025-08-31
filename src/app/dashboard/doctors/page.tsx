
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getDoctors, Doctor } from "./actions"
import { DoctorsTable } from "./doctors-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const doctorsData = await getDoctors();
      setDoctors(doctorsData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Doctors</CardTitle>
            <CardDescription>Manage doctor profiles and their details.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/doctors/new">
              <PlusCircle className="h-4 w-4" />
              Add Doctor
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading doctors...</p>
          ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Doctors</AlertTitle>
                <AlertDescription>
                  {error}
                  <p className="mt-2 text-xs">Please ensure your database is running and the connection details are correct.</p>
                </AlertDescription>
              </Alert>
           ) : (
            <DoctorsTable doctors={doctors} onDoctorDeleted={loadDoctors} />
           )}
        </CardContent>
      </Card>
    </div>
  )
}
