
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import type { RejectedPreAuth } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

  const handleExport = () => {
      const headers = ["Patient Name", "TPA / Insurance", "Reason for Rejection", "Amount Requested"];
      const csvRows = [headers.join(",")];

      requests.forEach((req) => {
          const row = [
              `"${req.patientName}"`,
              `"${req.tpaOrInsurerName}"`,
              `"${req.reason || 'N/A'}"`,
              req.amountRequested ?? 'N/A',
          ];
          csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "rejected_pre_auths.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rejected Pre-Auths</CardTitle>
              <CardDescription>These requests have been rejected by the TPA/Insurer.</CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" disabled={requests.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        </CardHeader>
        <CardContent>
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
                        {req.amountRequested?.toLocaleString('en-IN') ?? 'N/A'}
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
        </CardContent>
    </Card>
  );
}
