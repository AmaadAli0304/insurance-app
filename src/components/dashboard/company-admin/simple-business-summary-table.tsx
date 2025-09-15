
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { SimpleHospitalStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface SimpleBusinessSummaryTableProps {
  stats: SimpleHospitalStat[];
}

export function SimpleBusinessSummaryTable({ stats }: SimpleBusinessSummaryTableProps) {
    
    const totals = stats.reduce(
        (acc, curr) => {
            acc.numOfPatients += curr.numOfPatients;
            acc.amount += curr.amount;
            return acc;
        },
        {
            numOfPatients: 0,
            amount: 0,
        }
    );

    const handleExport = () => {
        const headers = ["Hospital Name", "No. of Patients", "Amount (Billed)"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.hospitalName}"`,
                stat.numOfPatients,
                stat.amount,
            ];
            csvRows.push(row.join(","));
        });
        
        csvRows.push([
            "TOTAL",
            totals.numOfPatients,
            totals.amount,
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "simple_hospital_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle>Simplified Hospital Summary</CardTitle>
                    <CardDescription>A summary of patients and billed amounts for each hospital.</CardDescription>
                </div>
                 <Button onClick={handleExport} variant="outline" size="sm" disabled={stats.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[350px]">Hospital Name</TableHead>
                            <TableHead className="text-right">No. of Patients</TableHead>
                            <TableHead className="text-right">Amount (Billed)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.map((stat) => (
                            <TableRow key={stat.hospitalId}>
                                <TableCell className="font-medium">{stat.hospitalName}</TableCell>
                                <TableCell className="text-right">{stat.numOfPatients}</TableCell>
                                <TableCell className="text-right">{stat.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableHead>TOTAL</TableHead>
                            <TableHead className="text-right">{totals.numOfPatients}</TableHead>
                            <TableHead className="text-right">{totals.amount.toLocaleString()}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
