
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash, Edit, Eye, Building } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { handleDeleteHospital } from "./actions"
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
import type { Hospital } from "@/lib/types"
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';


interface HospitalsTableProps {
  hospitals: Hospital[];
  onHospitalDeleted: () => void;
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

export function HospitalsTable({ hospitals, onHospitalDeleted }: HospitalsTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [state, formAction] = useActionState(handleDeleteHospital, { message: "", type: "initial" });
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  
  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: "Hospital Management",
        description: state.message,
        variant: "success",
      });
      onHospitalDeleted();
    } else if (state.type === 'error') {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast, onHospitalDeleted]);

  const handleRowClick = (hospitalId: string) => {
    router.push(`/dashboard/company-hospitals/${hospitalId}/view`);
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'H';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact Person</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hospitals.map(h => (
          <TableRow key={h.id} onClick={() => handleRowClick(h.id)} className="cursor-pointer">
            <TableCell className="font-medium flex items-center gap-3">
              <Avatar className="h-10 w-10">
                  <AvatarImage src={h.photo ?? undefined} alt={h.name} />
                  <AvatarFallback>{getInitials(h.name)}</AvatarFallback>
              </Avatar>
              {h.name}
            </TableCell>
            <TableCell>{h.contactPerson || 'N/A'}</TableCell>
            <TableCell>{h.email || 'N/A'}</TableCell>
            <TableCell>{h.phone || 'N/A'}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                     <DropdownMenuItem asChild>
                      <Link href={`/dashboard/company-hospitals/${h.id}/view`} className="flex items-center gap-2 cursor-pointer">
                        <Eye className="h-4 w-4" /> View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/company-hospitals/${h.id}/edit`} className="flex items-center gap-2 cursor-pointer">
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
                      This action cannot be undone. This will permanently delete the hospital
                      and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                     <form action={formAction} ref={formRef}>
                        <input type="hidden" name="id" value={h.id} />
                        <input type="hidden" name="userId" value={user?.uid || ''} />
                        <input type="hidden" name="userName" value={user?.name || ''} />
                        <input type="hidden" name="hospitalName" value={h.name} />
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
