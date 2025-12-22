
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMonthlySummaryReport } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface SummaryReportTableProps {}

interface StatItem {
  month: string;
  totalBillAmt: number;
  tpaApprovedAmt: number;
  amountBeforeTds: number;
  amountAfterTds: number;
  tds: number;
  finalAuthorisedAmount: number;
  patientCount: number;
  totalSettledCase: number;
  pendingCaseCount: number;
  totalRejectedCase: number;
}

export function SummaryReportTable({}: SummaryReportTableProps) {
    const [stats, setStats] = useState<StatItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getMonthlySummaryReport(selectedYear);
            setStats(data);
        } catch (error) {
            console.error("Failed to load summary report stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const calculateTotal = useCallback((key: keyof StatItem) => {
        if (!stats || !stats.length) return 0;
        return stats.reduce((sum, item) => {
            const value = item[key];
            return sum + (typeof value === 'number' ? value : 0);
        }, 0);
    }, [stats]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleExport = () => {
        if (!stats || stats.length === 0) return;
        
        const headers = [
            "Metric", 
            ...stats.map(s => s.month), 
            "Grand Total"
        ];
        
        const metrics: (keyof StatItem)[] = [
            "totalBillAmt", "tpaApprovedAmt", "amountBeforeTds", "amountAfterTds", "tds", 
            "finalAuthorisedAmount", "patientCount", "totalSettledCase", "pendingCaseCount", "totalRejectedCase"
        ];
        
        const metricLabels: Record<keyof StatItem, string> = {
            month: "Month",
            totalBillAmt: "Total Bill Amt.",
            tpaApprovedAmt: "TPA Approved Amt.",
            amountBeforeTds: "Amount Before TDS (Rs.)",
            amountAfterTds: "Amount After TDS (Rs.)",
            tds: "TDS",
            finalAuthorisedAmount: "Final Outstanding Amount",
            patientCount: "Total Patient",
            totalSettledCase: "Total Settlement Case",
            pendingCaseCount: "Total Pending Case",
            totalRejectedCase: "Cancelled cases"
        };
        
        const csvRows = [headers.join(",")];
        metrics.forEach(metric => {
            const rowData = [
                metricLabels[metric],
                ...stats.map(s => s[metric]),
                calculateTotal(metric)
            ];
            csvRows.push(rowData.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `summary_report_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderRow = (label: string, key: keyof StatItem, isCurrency: boolean = true) => {
        const total = calculateTotal(key);
        const formatFunction = isCurrency ? formatCurrency : (val: number) => val.toLocaleString('en-IN');
        
        return (
            <TableRow>
                <TableCell className="font-medium">{label}</TableCell>
                {stats.map((item, index) => (
                    <TableCell key={index} className="text-right font-mono">
                        {formatFunction(Number(item[key]))}
                    </TableCell>
                ))}
                <TableCell className="text-right font-mono font-bold bg-muted/50">
                    {formatFunction(total)}
                </TableCell>
            </TableRow>
        );
    };
    
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Summary Report</CardTitle>
                    <CardDescription>A monthly summary of key metrics.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExport} variant="outline" size="sm" disabled={!stats || stats.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Metric</TableHead>
                                    {stats.map((item, index) => (
                                        <TableHead key={index} className="text-right">
                                            {item.month}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right font-bold bg-muted/50">
                                        Grand Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderRow("Total Bill Amt.", "totalBillAmt")}
                                {renderRow("TPA Approved Amt.", "tpaApprovedAmt")}
                                {renderRow("Amount Before TDS", "amountBeforeTds")}
                                {renderRow("Amount After TDS", "amountAfterTds")}
                                {renderRow("TDS", "tds")}
                                {renderRow("Final Outstanding Amount", "finalAuthorisedAmount")}
                                {renderRow("Total Patients", "patientCount", false)}
                                {renderRow("Total Settlement Case", "totalSettledCase", false)}
                                {renderRow("Pending Case", "pendingCaseCount", false)}
                                {renderRow("Cancelled Case", "totalRejectedCase", false)}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
