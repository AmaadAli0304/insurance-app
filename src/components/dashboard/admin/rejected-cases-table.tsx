"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRejectedCases, RejectedCase } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface RejectedCasesTableProps {
  dateRange?: DateRange;
}

export function RejectedCasesTable({ dateRange }: RejectedCasesTableProps) {
    const [cases, setCases] = useState<RejectedCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const rejectedCases = await getRejectedCases(dateRange);
            setCases(rejectedCases);
        } catch (error) {
            console.error("Failed to load rejected cases:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleExport = () => {
        const headers = ["Patient Name", "TPA", "Reason", "Amount"];
        const csvRows = [headers.join(",")];

        cases.forEach((c) => {
            const row = [
                `"${c.patientName}"`,
                `"${c.tpaName}"`,
                `"${c.reason || 'N/A'}"`,
                c.amount,
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "rejected_cases.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Rejected cases</CardTitle>
                    <CardDescription>A list of claims that have been rejected.</CardDescription>
                </div>
                 <Button onClick={handleExport} variant="outline" size="sm" disabled={cases.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient Name</TableHead>
                                <TableHead>TPA</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cases.length > 0 ? (
                                cases.map((c, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{c.patientName}</TableCell>
                                        <TableCell>{c.tpaName}</TableCell>
                                        <TableCell className="text-destructive">{c.reason || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-mono">{c.amount.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No rejected cases found for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
