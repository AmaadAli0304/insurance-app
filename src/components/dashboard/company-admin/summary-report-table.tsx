"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSummaryReportStats, getHospitalList } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Hospital } from "@/lib/types";

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
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name'>[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, hospitalList] = await Promise.all([
                getSummaryReportStats(2025, selectedHospitalId),
                getHospitalList()
            ]);
            setStats(data);
            setHospitals(hospitalList);
        } catch (error) {
            console.error("Failed to load summary report stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedHospitalId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Function to calculate total for a specific metric
    const calculateTotal = useCallback((key: keyof StatItem) => {
        if (!stats.length) return 0;
        return stats.reduce((sum, item) => {
            const value = item[key];
            return sum + (typeof value === 'number' ? value : 0);
        }, 0);
    }, [stats]);

    // Function to format currency values
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Function to format regular numbers
    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-IN').format(value);
    };

    const handleExport = () => {
        if (!stats) return;
        
        const headers = ["Metric", ...stats.map(s => s.month), "Grand Total"];
        const keys: (keyof StatItem)[] = ["totalBillAmt", "tpaApprovedAmt", "amountBeforeTds", "amountAfterTds", "tds", "finalAuthorisedAmount", "patientCount", "totalSettledCase", "pendingCaseCount", "totalRejectedCase"];
        const labels: Record<keyof StatItem, string> = {
            month: "Month",
            totalBillAmt: "Total Bill Amt.",
            tpaApprovedAmt: "TPA Approved Amt.",
            amountBeforeTds: "Amount Before TDS",
            amountAfterTds: "Amount After TDS",
            tds: "TDS",
            finalAuthorisedAmount: "Final Outstanding Amount",
            patientCount: "Total Patients",
            totalSettledCase: "Total Settlement Case",
            pendingCaseCount: "Pending Case",
            totalRejectedCase: "Cancelled Case",
        };
        
        const csvRows = [headers.join(",")];
        keys.forEach(key => {
            const rowData = [labels[key], ...stats.map(s => s[key]), calculateTotal(key)];
            csvRows.push(rowData.join(","));
        });
        
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

    const renderRow = (label: string, key: keyof StatItem, isCurrency: boolean = true) => {
        const total = calculateTotal(key);
        const formatFn = isCurrency ? formatCurrency : formatNumber;
        
        return (
            <TableRow>
                <TableCell className="font-medium">{label}</TableCell>
                {stats.map((item, index) => (
                    <TableCell key={index} className="text-right font-mono">
                        {formatFn(Number(item[key]) || 0)}
                    </TableCell>
                ))}
                <TableCell className="text-right font-mono font-bold bg-muted/50">
                    {formatFn(total)}
                </TableCell>
            </TableRow>
        );
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Summary Report</CardTitle>
                    <CardDescription>An all-time summary of key metrics.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => setSelectedHospitalId(value === 'all' ? null : value)} defaultValue="all">
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Filter by Hospital" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Hospitals</SelectItem>
                            {hospitals.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
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
                )}
            </CardContent>
        </Card>
    );
}
