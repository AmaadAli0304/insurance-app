"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getStaff } from "./actions"
import { StaffTable } from "./staff-table"
import type { Staff } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEffect, useState, useCallback } from "react"

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const staffData = await getStaff();
      setStaff(staffData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);


  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Manage staff member details.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/staff/new">
              <PlusCircle className="h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <p>Loading staff...</p>
           ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Staff</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
           ) : (
            <StaffTable staff={staff} onStaffDeleted={loadStaff} />
           )}
        </CardContent>
      </Card>
    </div>
  )
}
