
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import type { PendingPreAuth } from "./actions";

interface PendingPreAuthsTableProps {
  requests: PendingPreAuth[];
}

export function PendingPreAuthsTable({ requests }: PendingPreAuthsTableProps) {
  const router = useRouter();

  const handleRowClick = (requestId: string) => {
    router.push(`/dashboard/pre-auths/${requestId}/view`);
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient Name</TableHead>
          <TableHead>TPA / Insurance</TableHead>
          <TableHead className="text-right">Amount Requested</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length > 0 ? (
          requests.map((req) => (
            <TableRow key={req.id} onClick={() => handleRowClick(req.id)} className="cursor-pointer">
              <TableCell className="font-medium">{req.patientName}</TableCell>
              <TableCell>{req.tpaOrInsurerName}</TableCell>
              <TableCell className="text-right font-mono">
                ₹{req.amountRequested.toLocaleString('en-IN')}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center">
              No pending requests found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
