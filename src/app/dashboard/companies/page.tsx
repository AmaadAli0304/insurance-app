
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { CompaniesTable } from "./companies-table"
import { mockCompanies } from "@/lib/mock-data"


export default async function CompaniesPage() {
  // Using mock data for now to ensure functionality
  const companies = mockCompanies;

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
           <CompaniesTable companies={companies} />
        </CardContent>
      </Card>
    </div>
  )
}
