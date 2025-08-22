
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
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
import type { Staff } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';

interface StaffTableProps {
  staff: Staff[];
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <AlertDialogAction type="submit" disabled={pending}>
            {pending ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
            ) : (
                'Continue'
            )}
        </AlertDialogAction>
    );
}

export function StaffTable({ staff }: StaffTableProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleDeleteStaff, { message: "", type: "initial" });
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: "Staff Management",
        description: "Staff member deleted successfully",
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
          <TableHead>Full Name</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map(s => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell>{s.designation}</TableCell>
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
                     <form action={formAction} ref={formRef}>
                        <input type="hidden" name="id" value={s.id} />
                        <DeleteButton />
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
