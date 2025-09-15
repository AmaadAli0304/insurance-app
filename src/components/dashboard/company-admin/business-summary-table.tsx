
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { HospitalBusinessStats } from "./actions";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface BusinessSummaryTableProps {
  stats: HospitalBusinessStats[];
  children: ReactNode;
}

export function BusinessSummaryTable({ stats, children }: BusinessSummaryTableProps) {
    
    const totals = stats.reduce(
        (acc, curr) => {
            acc.activePatients += curr.activePatients;
            acc.preAuthApproved += curr.preAuthApproved;
            acc.preAuthPending += curr.preAuthPending;
            acc.finalAuthSanctioned += curr.finalAuthSanctioned;
            acc.billedAmount += curr.billedAmount;
            acc.collection += curr.collection;
            return acc;
        },
        {
            activePatients: 0,
            preAuthApproved: 0,
            preAuthPending: 0,
            finalAuthSanctioned: 0,
            billedAmount: 0,
            collection: 0,
        }
    );

    const handleExport = () => {
        const headers = ["Hospital Name", "Active Patients", "Pre-Auths Approved", "Pre-Auths Pending", "Final Auths Sanctioned", "Billed Amount", "Collection"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.hospitalName}"`,
                stat.activePatients,
                stat.preAuthApproved,
                stat.preAuthPending,
                stat.finalAuthSanctioned,
                stat.billedAmount,
                stat.collection,
            ];
            csvRows.push(row.join(","));
        });
        
        csvRows.push([
            "TOTAL",
            totals.activePatients,
            totals.preAuthApproved,
            totals.preAuthPending,
            totals.finalAuthSanctioned,
            totals.billedAmount,
            totals.collection,
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "hospital_business_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Hospital Business Summary</CardTitle>
                  <CardDescription>A summary of business activity across all hospitals.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {children}
                    <Button onClick={handleExport} variant="outline" size="sm" disabled={stats.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Hospital Name</TableHead>
                            <TableHead className="text-right">Active Patients</TableHead>
                            <TableHead className="text-right">Pre-Auths Approved</TableHead>
                            <TableHead className="text-right">Pre-Auths Pending</TableHead>
                            <TableHead className="text-right">Final Auths Sanctioned</TableHead>
                            <TableHead className="text-right">Billed Amount</TableHead>
                            <TableHead className="text-right">Collection</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.map((stat) => (
                            <TableRow key={stat.hospitalId}>
                                <TableCell className="font-medium">{stat.hospitalName}</TableCell>
                                <TableCell className="text-right">{stat.activePatients}</TableCell>
                                <TableCell className="text-right">{stat.preAuthApproved}</TableCell>
                                <TableCell className="text-right">{stat.preAuthPending}</TableCell>
                                <TableCell className="text-right">{stat.finalAuthSanctioned}</TableCell>
                                <TableCell className="text-right">{stat.billedAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{stat.collection.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableHead>TOTAL</TableHead>
                            <TableHead className="text-right">{totals.activePatients}</TableHead>
                            <TableHead className="text-right">{totals.preAuthApproved}</TableHead>
                            <TableHead className="text-right">{totals.preAuthPending}</TableHead>
                            <TableHead className="text-right">{totals.finalAuthSanctioned}</TableHead>
                            <TableHead className="text-right">{totals.billedAmount.toLocaleString()}</TableHead>
                            <TableHead className="text-right">{totals.collection.toLocaleString()}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
