
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { handleDeleteField } from "./actions";
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
import type { Field } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';

interface FieldsTableProps {
  fields: Field[];
  onFieldDeleted: () => void;
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

export function FieldsTable({ fields, onFieldDeleted }: FieldsTableProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(handleDeleteField, { message: "", type: "initial" });
  const formRef = useRef<HTMLFormElement>(null);
  const { role } = useAuth();
  
  useEffect(() => {
    if (state.type === 'success') {
      toast({
        title: "Field",
        description: state.message,
        variant: "success",
      });
      onFieldDeleted();
    } else if (state.type === 'error') {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast, onFieldDeleted]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Required</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.length > 0 ? (
          fields.map(field => (
            <TableRow key={field.id}>
              <TableCell>{field.id}</TableCell>
              <TableCell>{field.companyName}</TableCell>
              <TableCell className="font-medium">{field.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{field.type}</Badge>
              </TableCell>
              <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                   <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon">
                           <Trash className="h-4 w-4 text-destructive" />
                           <span className="sr-only">Delete</span>
                        </Button>
                   </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this field.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                       <form action={formAction} ref={formRef}>
                          <input type="hidden" name="id" value={String(field.id)} />
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
              No fields defined yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
