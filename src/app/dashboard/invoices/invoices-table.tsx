
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { handleDeleteInvoice } from "./actions";
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
import type { Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface InvoicesTableProps {
  invoices: Invoice[];
  onInvoiceDeleted: () => void;
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

export function InvoicesTable({ invoices, onInvoiceDeleted }: InvoicesTableProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleDeleteInvoice, { message: "", type: "initial" });
  const router = useRouter();
  
  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: "Invoice Management",
        description: state.message,
        variant: "success",
      });
      onInvoiceDeleted();
    } else if (state.type === 'error') {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast, onInvoiceDeleted]);

  const handleRowClick = (invoiceId: number) => {
    router.push(`/dashboard/invoices/${invoiceId}/view`);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
        return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
        return "Invalid Date";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice ID</TableHead>
          <TableHead>Billed To</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Contract Type</TableHead>
          <TableHead>Service Period</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length > 0 ? (
          invoices.map(invoice => (
            <TableRow key={invoice.id} onClick={() => handleRowClick(invoice.id!)} className="cursor-pointer">
              <TableCell className="font-mono">INV-{String(invoice.id).padStart(4, '0')}</TableCell>
              <TableCell className="font-medium">{invoice.to}</TableCell>
              <TableCell>{formatDate(invoice.created_at)}</TableCell>
              <TableCell>{invoice.contract_type}</TableCell>
              <TableCell>{invoice.period}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/view`} className="flex items-center gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="flex items-center gap-2 cursor-pointer">
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
                        This action cannot be undone. This will permanently delete this invoice record.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                       <form action={formAction}>
                          <input type="hidden" name="id" value={invoice.id} />
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
              No invoices found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
