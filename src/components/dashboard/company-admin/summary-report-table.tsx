
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getMonthlySummaryReport, MonthlySummary } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
        years.push(i);
    }
    return years;
};

export function SummaryReportTable() {
    const [stats, setStats] = useState<MonthlySummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const yearOptions = generateYearOptions();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getMonthlySummaryReport(selectedYear);
            const monthlyDataMap = new Map(data.map(item => [item.month, item]));
            
            const fullYearData: MonthlySummary[] = Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                return monthlyDataMap.get(month) || {
                    month,
                    totalBillAmt: 0,
                    tpaApprovedAmt: 0,
                    amountBeforeTds: 0,
                    amountAfterTds: 0,
                    tds: 0,
                    totalPatient: 0,
                    totalSettlementCase: 0,
                    totalPendingCase: 0,
                    cancelledCases: 0,
                };
            });
            
            setStats(fullYearData);
        } catch (error) {
            console.error("Failed to load monthly summary:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const calculateTotal = (field: keyof Omit<MonthlySummary, 'month'>) => {
        return stats.reduce((acc, curr) => acc + curr[field], 0);
    };

    const handleExport = () => {
        const headers = ["Patient Monthly Data", ...MONTHS, "Grand Total"];
        const keys: (keyof Omit<MonthlySummary, 'month'>)[] = [
            "totalBillAmt", "tpaApprovedAmt", "amountBeforeTds", 
            "amountAfterTds", "tds", "totalPatient", 
            "totalSettlementCase", "totalPendingCase", "cancelledCases"
        ];
        const labels: Record<keyof Omit<MonthlySummary, 'month'>, string> = {
            totalBillAmt: "Total Bill Amt.",
            tpaApprovedAmt: "TPA Approved Amt.",
            amountBeforeTds: "Amount Before TDS (Rs.)",
            amountAfterTds: "Amount After TDS (Rs.)",
            tds: "TDS",
            totalPatient: "Total Patient :",
            totalSettlementCase: "Total Settlement Case :",
            totalPendingCase: "Total Pending Case :",
            cancelledCases: "Cancelled cases"
        };
        
        const csvRows = [headers.join(",")];
        keys.forEach(key => {
            const rowData = stats.map(monthData => monthData[key]);
            const total = calculateTotal(key);
            csvRows.push([`"${labels[key]}"`, ...rowData, total].join(','));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `monthly_summary_report_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderCell = (value: number) => value > 0 ? value.toLocaleString('en-IN') : '-';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Summary Report - {selectedYear}</CardTitle>
                    <CardDescription>A monthly breakdown of key metrics for the selected year.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExport} variant="outline" size="sm" disabled={isLoading}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px] min-w-[200px] sticky left-0 bg-card z-10">Patient Monthly Data</TableHead>
                                    {MONTHS.map(month => (
                                        <TableHead key={month} className="text-right min-w-[100px]">{`${month}-${String(selectedYear).slice(-2)}`}</TableHead>
                                    ))}
                                    <TableHead className="text-right font-bold min-w-[120px] sticky right-0 bg-card z-10">Grand Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Total Bill Amt.</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.totalBillAmt)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("totalBillAmt"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">TPA Approved Amt.</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.tpaApprovedAmt)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("tpaApprovedAmt"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Amount Before TDS (Rs.)</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.amountBeforeTds)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("amountBeforeTds"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Amount After TDS (Rs.)</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.amountAfterTds)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("amountAfterTds"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">TDS</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.tds)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("tds"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Total Outstanding Amount</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.amountBeforeTds - s.amountAfterTds)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("amountBeforeTds") - calculateTotal("amountAfterTds"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Total Patient</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.totalPatient)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("totalPatient"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Total Settlement Case</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.totalSettlementCase)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("totalSettlementCase"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Total Pending Case</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.totalPendingCase)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("totalPendingCase"))}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold sticky left-0 bg-card z-10">Cancelled cases</TableCell>
                                    {stats.map(s => <TableCell key={s.month} className="text-right font-mono">{renderCell(s.cancelledCases)}</TableCell>)}
                                    <TableCell className="text-right font-bold font-mono sticky right-0 bg-card z-10">{renderCell(calculateTotal("cancelledCases"))}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
