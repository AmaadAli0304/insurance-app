
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getFinalApprovalStats, FinalApprovalStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FinalApprovalDetailsTableProps {
  dateRange?: DateRange;
}

export function FinalApprovalDetailsTable({ dateRange }: FinalApprovalDetailsTableProps) {
    const [stats, setStats] = useState<FinalApprovalStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { stats: data, total } = await getFinalApprovalStats(dateRange, currentPage, itemsPerPage);
            setStats(data);
            setTotalPages(Math.ceil(total / itemsPerPage));
        } catch (error) {
            console.error("Failed to load final approval stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, currentPage, itemsPerPage]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const totals = stats.reduce((acc, stat) => {
        acc.final_bill += stat.final_bill || 0;
        acc.hospital_discount += stat.hospital_discount || 0;
        acc.nm_deductions += stat.nm_deductions || 0;
        acc.co_pay += stat.co_pay || 0;
        acc.finalAuthorisedAmount += stat.finalAuthorisedAmount || 0;
        return acc;
    }, { final_bill: 0, hospital_discount: 0, nm_deductions: 0, co_pay: 0, finalAuthorisedAmount: 0 });

    const handleExport = () => {
        const headers = ["Patient Name", "TPA Name", "Final Hospital Bill", "Hospital Discount", "NM Deductions", "Co-Pay", "Final Authorised Amount"];
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };
    
    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };


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
                    <>
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.length > 0 ? (
                                    stats.map((stat, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                                    <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                                </Avatar>
                                                {stat.patientName}
                                            </TableCell>
                                            <TableCell>{stat.tpaName}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stat.final_bill || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stat.hospital_discount || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stat.nm_deductions || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stat.co_pay || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stat.finalAuthorisedAmount || 0)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No final approval data available for the selected period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            {stats.length > 0 && (
                                <TableFooter>
                                    <TableRow>
                                        <TableHead colSpan={2}>TOTAL</TableHead>
                                        <TableHead className="text-right font-mono">{formatCurrency(totals.final_bill)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatCurrency(totals.hospital_discount)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatCurrency(totals.nm_deductions)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatCurrency(totals.co_pay)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatCurrency(totals.finalAuthorisedAmount)}</TableHead>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
