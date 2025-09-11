
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import type { RejectedPreAuth } from "./actions";

interface RejectedPreAuthsTableProps {
  requests: RejectedPreAuth[];
}

export function RejectedPreAuthsTable({ requests }: RejectedPreAuthsTableProps) {
  const router = useRouter();

  const handleRowClick = (claimId: string) => {
    // Note: The view page might need to be adjusted if it expects a pre-auth ID
    // For now, linking to a conceptual claim view page.
    router.push(`/dashboard/claims/${claimId}/view`);
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient Name</TableHead>
          <TableHead>TPA / Insurance</TableHead>
          <TableHead>Reason for Rejection</TableHead>
          <TableHead className="text-right">Amount Requested</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length > 0 ? (
          requests.map((req) => (
            <TableRow key={req.id} onClick={() => handleRowClick(req.id)} className="cursor-pointer">
              <TableCell className="font-medium">{req.patientName}</TableCell>
              <TableCell>{req.tpaOrInsurerName}</TableCell>
              <TableCell className="text-destructive">{req.reason || 'No reason provided'}</TableCell>
              <TableCell className="text-right font-mono">
                ₹{req.amountRequested?.toLocaleString('en-IN') ?? 'N/A'}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center">
              No rejected claims found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
