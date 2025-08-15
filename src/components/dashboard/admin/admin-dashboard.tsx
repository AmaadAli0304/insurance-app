"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { mockHospitals, mockInsuranceCompanies } from "@/lib/mock-data"

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Admin!</CardTitle>
            <CardDescription>Manage hospitals, insurance companies, and system settings from this central hub.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="flex flex-col justify-center">
            <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center">
                    <p className="text-3xl font-bold">{mockHospitals.length}</p>
                    <p className="text-sm text-muted-foreground">Hospitals</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold">{mockInsuranceCompanies.length}</p>
                    <p className="text-sm text-muted-foreground">Insurance Companies</p>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hospitals</CardTitle>
            <CardDescription>Manage hospital profiles and their assigned insurance providers.</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Add Hospital
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Assigned Insurers</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHospitals.map(h => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.address}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{h.assignedInsuranceCompanies.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Assign Insurance</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Insurance Companies</CardTitle>
            <CardDescription>Manage insurance company profiles and their offered plans.</CardDescription>
          </div>
           <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Add Company
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plans</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInsuranceCompanies.map(c => (
                 <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.contact}</TableCell>
                  <TableCell><Badge variant="secondary">{c.plans.length}</Badge></TableCell>
                   <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Manage Plans</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
