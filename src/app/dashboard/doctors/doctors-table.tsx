
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { handleDeleteDoctor, Doctor } from "./actions";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface DoctorsTableProps {
  doctors: Doctor[];
  onDoctorDeleted: () => void;
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

export function DoctorsTable({ doctors, onDoctorDeleted }: DoctorsTableProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleDeleteDoctor, { message: "", type: "initial" });
  const router = useRouter();
  
  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: "Doctor",
        description: state.message,
        variant: "success",
      });
      onDoctorDeleted();
    } else if (state.type === 'error') {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast, onDoctorDeleted]);

  const handleRowClick = (doctorId: number) => {
    router.push(`/dashboard/doctors/${doctorId}/view`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Assigned Hospital</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Registration No.</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {doctors.length > 0 ? (
          doctors.map(doctor => (
            <TableRow key={doctor.id} onClick={() => handleRowClick(doctor.id!)} className="cursor-pointer">
              <TableCell className="font-medium">{doctor.name}</TableCell>
              <TableCell>{doctor.hospitalName || 'N/A'}</TableCell>
              <TableCell>{doctor.email || 'N/A'}</TableCell>
              <TableCell>{doctor.phone || 'N/A'}</TableCell>
              <TableCell>{doctor.reg_no || 'N/A'}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/doctors/${doctor.id}/view`} className="flex items-center gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/doctors/${doctor.id}/edit`} className="flex items-center gap-2 cursor-pointer">
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
                        This action cannot be undone. This will permanently delete this doctor's record.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                       <form action={formAction}>
                          <input type="hidden" name="id" value={doctor.id} />
                          <DeleteButton />
                       </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No doctors found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
