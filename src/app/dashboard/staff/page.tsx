
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Trash, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { mockHospitals, mockStaff } from "@/lib/mock-data"
import Link from "next/link"
import { handleDeleteStaff } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth-provider"

export default function StaffPage() {
  const { user } = useAuth();
  const staff = mockStaff.filter(s => s.companyId === user?.companyId);
  const getHospitalName = (hospitalId?: string) => {
    if (!hospitalId) return 'N/A';
    return mockHospitals.find(h => h.id === hospitalId)?.name || 'N/A';
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Manage staff member details for your company.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" asChild>
            <Link href="/dashboard/staff/new">
              <PlusCircle className="h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Assigned Hospital</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell>{s.designation}</TableCell>
                  <TableCell>{getHospitalName(s.hospitalId)}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'Active' ? 'default' : 'destructive'} className={s.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}>{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/staff/${s.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                              <Edit className="h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialogTrigger asChild>
                             <DropdownMenuItem className="text-destructive flex items-center gap-2 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                               <Trash className="h-4 w-4" /> Delete
                             </DropdownMenuItem>
                           </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this staff record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <form action={handleDeleteStaff}>
                              <input type="hidden" name="id" value={s.id} />
                              <AlertDialogAction type="submit">Continue</AlertDialogAction>
                           </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
