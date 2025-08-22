import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getCompanies } from "./actions"
import { CompaniesTable } from "./companies-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default async function CompaniesPage() {
  let companies = [];
  let error = null;

  try {
    companies = await getCompanies();
  } catch (e) {
    console.error(e); // Also log it on the server
    error = e instanceof Error ? e.message : "An unknown error occurred.";
  }

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
          {error ? (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Fetching Companies</AlertTitle>
                <AlertDescription>
                  {error}
                  <p className="mt-2 text-xs">This is likely an issue with the database connection on the deployed server (Vercel). Please check your environment variables and firewall settings.</p>
                </AlertDescription>
              </Alert>
          ) : (
            <CompaniesTable companies={companies} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
