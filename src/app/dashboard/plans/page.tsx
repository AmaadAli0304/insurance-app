
"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { mockCompanies } from "@/lib/mock-data"

export default function StaffingPackagesPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  
  const company = mockCompanies.find(c => c.id === companyId);

  return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staffing Packages</CardTitle>
              <CardDescription>Manage your company's staffing packages.</CardDescription>
            </div>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Package
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Monthly Rate</TableHead>
                   <TableHead>Package ID</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company?.packages.map(p => (
                  <TableRow key={p.packageId}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>${p.monthlyRate.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{p.packageId}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
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
