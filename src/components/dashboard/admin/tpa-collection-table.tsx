
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getTpaCollectionStats, TpaCollectionStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";

interface TpaCollectionTableProps {
  dateRange?: DateRange;
}

export function TpaCollectionTable({ dateRange }: TpaCollectionTableProps) {
    const [stats, setStats] = useState<TpaCollectionStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const tpaData = await getTpaCollectionStats(dateRange);
            setStats(tpaData);
        } catch (error) {
            console.error("Failed to load TPA collection stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const totals = stats.reduce((acc, stat) => {
        acc.amount += stat.amount;
        acc.received += stat.received;
        acc.deductions += stat.deductions;
        return acc;
    }, { amount: 0, received: 0, deductions: 0 });

    const handleExport = () => {
        const headers = ["TPA", "Amount", "Received", "Deductions"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.tpaName}"`,
                stat.amount,
                stat.received,
                stat.deductions,
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "tpa_collection_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Collection TPA wise</CardTitle>
                    <CardDescription>A summary of billed, received, and deducted amounts per TPA.</CardDescription>
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
                                <TableHead>TPA</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Received</TableHead>
                                <TableHead className="text-right">Deductions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length > 0 ? (
                                stats.map((stat) => (
                                    <TableRow key={stat.tpaId}>
                                        <TableCell className="font-medium">{stat.tpaName}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.amount.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.received.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.deductions.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No TPA collection data available for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                         {stats.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableHead>TOTAL</TableHead>
                                    <TableHead className="text-right font-mono">{totals.amount.toLocaleString('en-IN')}</TableHead>
                                    <TableHead className="text-right font-mono">{totals.received.toLocaleString('en-IN')}</TableHead>
                                    <TableHead className="text-right font-mono">{totals.deductions.toLocaleString('en-IN')}</TableHead>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
