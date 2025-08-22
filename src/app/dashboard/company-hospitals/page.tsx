

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getHospitals } from "./actions"
import { HospitalsTable } from "./hospitals-table"
import type { Hospital } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function CompanyHospitalsPage() {
  let hospitals: Hospital[] = [];
  let error: string | null = null;

  try {
    hospitals = await getHospitals();
  } catch (e: any) {
    error = e.message;
  }

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
           {error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Fetching Hospitals</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
           ) : (
            <HospitalsTable hospitals={hospitals} />
           )}
        </CardContent>
      </Card>
    </div>
  )
}
