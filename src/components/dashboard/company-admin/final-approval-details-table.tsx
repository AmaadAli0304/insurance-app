

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getFinalApprovalStats, FinalApprovalStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface FinalApprovalDetailsTableProps {
  dateRange?: DateRange;
}

export function FinalApprovalDetailsTable({ dateRange }: FinalApprovalDetailsTableProps) {
    const [stats, setStats] = useState<FinalApprovalStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getFinalApprovalStats(dateRange);
            setStats(data);
        } catch (error) {
            console.error("Failed to load final approval stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const totals = stats.reduce((acc, stat) => {
        acc.final_bill += stat.final_bill || 0;
        acc.hospital_discount += stat.hospital_discount || 0;
        acc.nm_deductions += stat.nm_deductions || 0;
        acc.co_pay += stat.co_pay || 0;
        acc.finalAuthorisedAmount += stat.finalAuthorisedAmount || 0;
        acc.amountPaidByInsured += stat.amountPaidByInsured || 0;
        return acc;
    }, { final_bill: 0, hospital_discount: 0, nm_deductions: 0, co_pay: 0, finalAuthorisedAmount: 0, amountPaidByInsured: 0 });

    const handleExport = () => {
        const headers = ["Patient Name", "TPA Name", "Final Hospital Bill", "Hospital Discount", "NM Deductions", "Co-Pay", "Final Authorised Amount", "Amount Paid by insured"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.patientName}"`,
                `"${stat.tpaName}"`,
                stat.final_bill || 0,
                stat.hospital_discount || 0,
                stat.nm_deductions || 0,
                stat.co_pay || 0,
                stat.finalAuthorisedAmount || 0,
                stat.amountPaidByInsured || 0,
            ];
            csvRows.push(row.join(","));
        });
        
        csvRows.push([
            "TOTAL",
            "",
            totals.final_bill,
            totals.hospital_discount,
            totals.nm_deductions,
            totals.co_pay,
            totals.finalAuthorisedAmount,
            totals.amountPaidByInsured,
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "final_approval_details.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Final Approval Details</CardTitle>
                    <CardDescription>Details of all claims that have reached final approval.</CardDescription>
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
                                <TableHead>Patient Name</TableHead>
                                <TableHead>TPA Name</TableHead>
                                <TableHead className="text-right">Final Hospital Bill</TableHead>
                                <TableHead className="text-right">Hospital Discount</TableHead>
                                <TableHead className="text-right">NM Deductions</TableHead>
                                <TableHead className="text-right">Co-Pay</TableHead>
                                <TableHead className="text-right">Final Authorised Amount</TableHead>
                                <TableHead className="text-right">Amount Paid by insured</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length > 0 ? (
                                stats.map((stat, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{stat.patientName}</TableCell>
                                        <TableCell>{stat.tpaName}</TableCell>
                                        <TableCell className="text-right font-mono">{formatValue(stat.final_bill || 0)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatValue(stat.hospital_discount || 0)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatValue(stat.nm_deductions || 0)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatValue(stat.co_pay || 0)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatValue(stat.finalAuthorisedAmount || 0)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatValue(stat.amountPaidByInsured || 0)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No final approval data available for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {stats.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableHead colSpan={2}>TOTAL</TableHead>
                                    <TableHead className="text-right font-mono">{formatValue(totals.final_bill)}</TableHead>
                                    <TableHead className="text-right font-mono">{formatValue(totals.hospital_discount)}</TableHead>
                                    <TableHead className="text-right font-mono">{formatValue(totals.nm_deductions)}</TableHead>
                                    <TableHead className="text-right font-mono">{formatValue(totals.co_pay)}</TableHead>
                                    <TableHead className="text-right font-mono">{formatValue(totals.finalAuthorisedAmount)}</TableHead>
                                    <TableHead className="text-right font-mono">{formatValue(totals.amountPaidByInsured)}</TableHead>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
