
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getStaffSalaryStats, StaffSalaryStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface StaffSalaryTableProps {
  dateRange?: DateRange;
}

export function StaffSalaryTable({ dateRange }: StaffSalaryTableProps) {
    const [stats, setStats] = useState<StaffSalaryStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getStaffSalaryStats(dateRange);
            setStats(data);
        } catch (error) {
            console.error("Failed to load staff salary stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const totals = stats.reduce((acc, stat) => {
        acc.invoiceAmount += stat.invoiceAmount;
        acc.amountReceived += stat.amountReceived;
        acc.tds += stat.tds;
        acc.gst += stat.gst;
        return acc;
    }, { invoiceAmount: 0, amountReceived: 0, tds: 0, gst: 0 });

    const handleExport = () => {
        const headers = ["Hospital", "Invoice Amount", "Invoice No", "Status", "Amount Received", "TDS", "GST"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.hospitalName}"`,
                stat.invoiceAmount,
                `"${stat.invoiceNo}"`,
                `"${stat.status}"`,
                stat.amountReceived,
                stat.tds,
                stat.gst
            ];
            csvRows.push(row.join(","));
        });
        
        csvRows.push([
            "TOTAL",
            totals.invoiceAmount,
            "", // No total for invoice no
            "", // No total for status
            totals.amountReceived,
            totals.tds,
            totals.gst,
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "staff_salary_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Invoice</CardTitle>
                    <CardDescription>A summary of staff salary invoices.</CardDescription>
                </div>
                <Button onClick={handleExport} variant="outline" size="sm" disabled={stats.length === 0}>
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
                                <TableHead>Hospital</TableHead>
                                <TableHead className="text-right">Invoice amount</TableHead>
                                <TableHead>Invoice No</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount received</TableHead>
                                <TableHead className="text-right">TDS</TableHead>
                                <TableHead className="text-right">GST</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length > 0 ? (
                                stats.map((stat, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{stat.hospitalName}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.invoiceAmount.toLocaleString('en-IN')}</TableCell>
                                        <TableCell>{stat.invoiceNo}</TableCell>
                                        <TableCell>{stat.status}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.amountReceived.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.tds.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.gst.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No staff salary data available for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {stats.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableHead>TOTAL</TableHead>
                                    <TableHead className="text-right font-mono">{totals.invoiceAmount.toLocaleString('en-IN')}</TableHead>
                                    <TableHead></TableHead>
                                    <TableHead></TableHead>
                                    <TableHead className="text-right font-mono">{totals.amountReceived.toLocaleString('en-IN')}</TableHead>
                                    <TableHead className="text-right font-mono">{totals.tds.toLocaleString('en-IN')}</TableHead>
                                    <TableHead className="text-right font-mono">{totals.gst.toLocaleString('en-IN')}</TableHead>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
