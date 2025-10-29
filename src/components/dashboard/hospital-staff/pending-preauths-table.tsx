
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import type { PendingPreAuth } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PendingPreAuthsTableProps {
  requests: PendingPreAuth[];
  title: string;
  description: string;
  filename: string;
}

export function PendingPreAuthsTable({ requests, title, description, filename }: PendingPreAuthsTableProps) {
  const router = useRouter();

  const handleRowClick = (patientId: number) => {
    router.push(`/dashboard/patients/${patientId}/view`);
  };

  const handleExport = () => {
      const headers = ["Patient Name", "TPA / Insurance", "Amount Requested"];
      const csvRows = [headers.join(",")];

      requests.forEach((req) => {
          const row = [
              `"${req.patientName}"`,
              `"${req.tpaOrInsurerName}"`,
              req.amountRequested,
          ];
          csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
              <TableHead className="text-right">Amount Requested</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((req) => (
                <TableRow key={req.id} onClick={() => handleRowClick(req.patientId)} className="cursor-pointer">
                  <TableCell className="font-medium">{req.patientName}</TableCell>
                  <TableCell>{req.tpaOrInsurerName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {req.amountRequested.toLocaleString('en-IN')}
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
      </CardContent>
    </Card>
  );
}
