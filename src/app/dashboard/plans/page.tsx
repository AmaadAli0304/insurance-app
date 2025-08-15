
"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { mockInsuranceCompanies } from "@/lib/mock-data"

export default function InsurancePlansPage() {
  const { user } = useAuth();
  const insuranceCompanyId = user?.insuranceCompanyId;
  
  const company = mockInsuranceCompanies.find(c => c.id === insuranceCompanyId);

  return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Insurance Plans</CardTitle>
              <CardDescription>Manage your company's insurance plans.</CardDescription>
            </div>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Plan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Coverage Amount</TableHead>
                   <TableHead>Plan ID</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company?.plans.map(p => (
                  <TableRow key={p.planId}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>${p.coverageAmount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{p.planId}</TableCell>
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
