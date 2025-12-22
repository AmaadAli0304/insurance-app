
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSummaryReportStats } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";


export function SummaryReportTable() {
    const [totalBillAmt, setTotalBillAmt] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSummaryReportStats();
            setTotalBillAmt(data.totalBillAmt);
        } catch (error) {
            console.error("Failed to load summary report stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const handleExport = () => {
        const headers = ["Metric", "Amount"];
        const csvRows = [headers.join(",")];

        csvRows.push([
            "Total Bill Amt.",
            totalBillAmt
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `summary_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Summary Report</CardTitle>
                    <CardDescription>A high-level summary of key metrics.</CardDescription>
                </div>
                 <Button onClick={handleExport} variant="outline" size="sm" disabled={isLoading}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Total Bill Amt.</TableCell>
                                <TableCell className="text-right font-mono">
                                    {totalBillAmt.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
