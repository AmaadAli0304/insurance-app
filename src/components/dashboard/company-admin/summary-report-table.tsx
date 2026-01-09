"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSummaryReportStats, getHospitalList } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Hospital } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

interface SummaryReportTableProps {
  year?: number;
}

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

export function SummaryReportTable({ year = new Date().getFullYear() }: SummaryReportTableProps) {
    const { user, role } = useAuth();
    const [stats, setStats] = useState<StatItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name'>[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const hospitalIdForQuery = role === 'Hospital Staff' || role === 'Admin' ? user?.hospitalId : selectedHospitalId;
            const [data, hospitalList] = await Promise.all([
                getSummaryReportStats(year, hospitalIdForQuery, date),
                (role === 'Company Admin') ? getHospitalList() : Promise.resolve([])
            ]);
            setStats(data);
            setHospitals(hospitalList);
        } catch (error) {
            console.error("Failed to load summary report stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [year, selectedHospitalId, role, user?.hospitalId, date]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [loadData, user]);

    const calculateTotal = useCallback((key: keyof StatItem) => {
        if (!stats.length) return 0;
        return stats.reduce((sum, item) => {
            const value = item[key];
            return sum + (typeof value === 'number' ? value : 0);
        }, 0);
    }, [stats]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

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
                     {(role === 'Company Admin') && (
                        <Select onValueChange={(value) => setSelectedHospitalId(value === 'all' ? null : value)} defaultValue="all">
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Filter by Hospital" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Hospitals</SelectItem>
                                {hospitals.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "w-[300px] justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                              date.to ? (
                                <>
                                  {format(date.from, "LLL dd, y")} -{" "}
                                  {format(date.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(date.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                    </Popover>
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
