
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getSettledStatusStats, SettledStatusStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SettledStatusDetailsTableProps {
  dateRange?: DateRange;
}

export function SettledStatusDetailsTable({ dateRange }: SettledStatusDetailsTableProps) {
    const [stats, setStats] = useState<SettledStatusStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { stats: data, total } = await getSettledStatusStats(dateRange, currentPage, itemsPerPage);
            setStats(data);
            setTotalPages(Math.ceil(total / itemsPerPage));
        } catch (error) {
            console.error("Failed to load settled status stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, currentPage, itemsPerPage]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const totals = stats.reduce((acc, stat) => {
        acc.finalAuthorisedAmount += Number(stat.finalAuthorisedAmount) || 0;
        acc.deduction += Number(stat.deduction) || 0;
        acc.tds += Number(stat.tds) || 0;
        acc.finalSettlementAmount += Number(stat.finalSettlementAmount) || 0;
        acc.netAmountCredited += Number(stat.netAmountCredited) || 0;
        return acc;
    }, { finalAuthorisedAmount: 0, deduction: 0, tds: 0, finalSettlementAmount: 0, netAmountCredited: 0 });

    const handleExport = () => {
        const headers = ["Patient Name", "TPA", "Final Authorised Amount", "Deduction", "TDS", "Final Settlement Amount", "Net Amount Credited"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.patientName}"`,
                `"${stat.tpaName}"`,
                stat.finalAuthorisedAmount || 0,
                stat.deduction || 0,
                stat.tds || 0,
                stat.finalSettlementAmount || 0,
                stat.netAmountCredited || 0,
            ];
            csvRows.push(row.join(","));
        });
        
        csvRows.push([
            "TOTAL",
            "",
            totals.finalAuthorisedAmount,
            totals.deduction,
            totals.tds,
            totals.finalSettlementAmount,
            totals.netAmountCredited,
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "settled_status_details.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const formatValue = (value: number) => {
        return value.toLocaleString('en-IN');
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
                    <CardTitle>Settled Status Details</CardTitle>
                    <CardDescription>Details of all claims that have been settled.</CardDescription>
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
                                    <TableHead>TPA</TableHead>
                                    <TableHead className="text-right">Final Authorised Amount</TableHead>
                                    <TableHead className="text-right">Deduction</TableHead>
                                    <TableHead className="text-right">TDS</TableHead>
                                    <TableHead className="text-right">Final Settlement Amount</TableHead>
                                    <TableHead className="text-right">Net Amount Credited</TableHead>
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
                                            <TableCell className="text-right font-mono">{formatValue(stat.finalAuthorisedAmount || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatValue(stat.deduction || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatValue(stat.tds || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatValue(stat.finalSettlementAmount || 0)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatValue(stat.netAmountCredited || 0)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No settled claims data available for the selected period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            {stats.length > 0 && (
                                <TableFooter>
                                    <TableRow>
                                        <TableHead colSpan={2}>TOTAL</TableHead>
                                        <TableHead className="text-right font-mono">{formatValue(totals.finalAuthorisedAmount)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatValue(totals.deduction)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatValue(totals.tds)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatValue(totals.finalSettlementAmount)}</TableHead>
                                        <TableHead className="text-right font-mono">{formatValue(totals.netAmountCredited)}</TableHead>
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
