
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSummaryReportStats } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface SummaryReportTableProps {}

export function SummaryReportTable({}: SummaryReportTableProps) {
    const [stats, setStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSummaryReportStats();
            setStats(data);
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
        if (!stats) return;
        
        const headers = ["Metric", "Value"];
        const csvRows = [
            headers.join(","),
            `"Total Bill Amt.",${stats.totalBillAmt}`
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "summary_report.csv");
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
                    <CardDescription>An all-time summary of key metrics.</CardDescription>
                </div>
                <Button onClick={handleExport} variant="outline" size="sm" disabled={!stats}>
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
                                <TableHead className="text-right">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Total Bill Amt.</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.totalBillAmt}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">TPA Approved Amt.</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.tpaApprovedAmt}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Amount Before TDS</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.amountBeforeTds}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Amount After TDS</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.amountAfterTds}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">TDS</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.tds}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Final Outstanding Amount</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.finalAuthorisedAmount}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total Patients</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.patientCount}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total Settlement Case</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.totalSettledCase}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Pending Case</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.pendingCaseCount}
                                    
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Cancelled Case</TableCell>
                                <TableCell className="text-right font-mono">
                                    {stats?.totalRejectedCase}
                                    
                                </TableCell>
                            </TableRow>
                            
                            
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
