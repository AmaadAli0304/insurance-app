
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { handleDeleteCompany } from "./actions"
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
import type { Company } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";

interface CompaniesTableProps {
  companies: Company[];
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleDeleteCompany, { message: "", type: "initial" });
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: "Success",
        description: state.message,
        variant: "success",
      });
    } else if (state.type === 'error') {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact Person</TableHead>
          <TableHead>Email</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map(c => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell>{c.contactPerson || 'N/A'}</TableCell>
            <TableCell>{c.email || 'N/A'}</TableCell>
            <TableCell>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/companies/${c.id}/edit`} className="flex items-center gap-2 cursor-pointer">
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
                      This action cannot be undone. This will permanently delete the company.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                     <form action={formAction} ref={formRef}>
                        <input type="hidden" name="id" value={c.id} />
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
  );
}
