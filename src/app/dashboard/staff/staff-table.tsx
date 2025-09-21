
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit, Eye, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { handleDeleteStaff } from "./actions";
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
import type { Staff } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';


interface StaffTableProps {
  staff: Staff[];
  onStaffDeleted: () => void;
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

export function StaffTable({ staff, onStaffDeleted }: StaffTableProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleDeleteStaff, { message: "", type: "initial" });
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: "Staff Management",
        description: state.message,
        variant: "success",
      });
      onStaffDeleted();
    } else if (state.type === 'error') {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast, onStaffDeleted]);

  const handleRowClick = (staffId: string) => {
    router.push(`/dashboard/staff/${staffId}/view`);
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Full Name</TableHead>
          <TableHead>Assigned Hospital</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.length > 0 ? (
          staff.map(s => {
            let photoUrl: string | null = null;
            if (s.photo) {
                try {
                    const photoData = JSON.parse(s.photo as string);
                    photoUrl = photoData.url;
                } catch {
                    if (typeof s.photo === 'string' && s.photo.startsWith('http')) {
                        photoUrl = s.photo;
                    }
                }
            }
            return (
            <TableRow key={s.id} onClick={() => handleRowClick(s.id)} className="cursor-pointer">
              <TableCell className="font-medium flex items-center gap-3">
                 <Avatar className="h-10 w-10">
                    <AvatarImage src={photoUrl ?? undefined} alt={s.name} />
                    <AvatarFallback>{getInitials(s.name)}</AvatarFallback>
                </Avatar>
                {s.name}
              </TableCell>
              <TableCell>{s.hospitalName || 'N/A'}</TableCell>
              <TableCell>{s.email}</TableCell>
              <TableCell>{s.role || 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={s.status === 'Active' ? 'default' : 'destructive'} className={s.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}>{s.status}</Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/staff/${s.id}/view`} className="flex items-center gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
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
                          <input type="hidden" name="userId" value={user?.uid ?? ''} />
                          <input type="hidden" name="userName" value={user?.name ?? ''} />
                          <input type="hidden" name="staffName" value={s.name ?? ''} />
                          <DeleteButton />
                       </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          )})
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No data found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
