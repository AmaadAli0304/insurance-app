

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSummaryReportStats, SummaryReportStats } from "./actions";
import { Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface SummaryReportTableProps {
    dateRange?: DateRange;
}

export function SummaryReportTable({ dateRange }: SummaryReportTableProps) {
    const [stats, setStats] = useState<SummaryReportStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSummaryReportStats(dateRange);
            setStats(data);
        } catch (error) {
            console.error("Failed to load summary report:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const renderCell = (value: number | undefined | null) => {
        if (value === undefined || value === null) return '-';
        return value > 0 ? value.toLocaleString('en-IN') : '-';
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Summary Report</CardTitle>
                    <CardDescription>An all-time summary of key metrics.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Metric</TableHead>
                                    <TableHead className="text-right">Total Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-semibold">Total Bill Amt.</TableCell>
                                    <TableCell className="text-right font-mono">{renderCell(stats?.totalBillAmt)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
