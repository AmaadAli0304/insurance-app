
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getInvoiceStats, InvoiceStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface InvoiceSummaryTableProps {
  dateRange?: DateRange;
}

export function InvoiceSummaryTable({ dateRange }: InvoiceSummaryTableProps) {
    const [stats, setStats] = useState<InvoiceStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getInvoiceStats(dateRange);
            setStats(data);
        } catch (error) {
            console.error("Failed to load invoice stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const totals = stats.reduce((acc, stat) => {
        acc.invoiceAmount += stat.invoiceAmount;
        acc.gst += stat.gst;
        return acc;
    }, { invoiceAmount: 0, gst: 0 });

    const handleExport = () => {
        const headers = ["Hospital", "Invoice Amount", "Invoice No", "Status", "GST"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.hospitalName}"`,
                stat.invoiceAmount,
                `"INV-${String(stat.id).padStart(4, '0')}"`,
                `"${stat.status}"`,
                stat.gst
            ];
            csvRows.push(row.join(","));
        });
        
        csvRows.push([
            "TOTAL",
            totals.invoiceAmount,
            "", 
            "", 
            totals.gst,
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "invoice_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Invoice Summary</CardTitle>
                    <CardDescription>A summary of all invoices.</CardDescription>
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
                                <TableHead className="text-right">GST</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length > 0 ? (
                                stats.map((stat, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{stat.hospitalName}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.invoiceAmount.toLocaleString('en-IN')}</TableCell>
                                        <TableCell>INV-{String(stat.id).padStart(4, '0')}</TableCell>
                                        <TableCell>{stat.status}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.gst.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No invoice data available for the selected period.
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
