
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StaffPerformanceStat } from "./actions";
import { Loader2, Download, Calendar as CalendarIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { getStaffPerformanceStats } from "./actions";

interface StaffPerformanceTableProps {
  // The stats and isLoading props are now removed as the component will fetch its own data.
}

export function StaffPerformanceTable({}: StaffPerformanceTableProps) {
    const [stats, setStats] = useState<StaffPerformanceStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const staffData = await getStaffPerformanceStats(date);
            setStats(staffData);
        } catch (err: any) {
            console.error("Failed to load staff performance:", err);
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getInitials = (name: string) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleExport = () => {
        const headers = ["Staff Name", "Hospital", "No of Cases", "No. of Preauth Approved Cases", "Total Final Approval", "No. of Denial Cases", "No. of Settled Cases", "Total Collection", "Attendance"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.staffName}"`,
                `"${stat.hospitalName}"`,
                stat.numOfCases,
                stat.preAuthApprovedCases,
                stat.totalFinalApproval,
                stat.rejectionCount,
                stat.settledCasesCount,
                stat.totalCollection,
                stat.attendance,
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "staff_performance.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Staff Performance</CardTitle>
                    <CardDescription>Performance metrics for each staff member.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
                    <Button onClick={handleExport} variant="outline" size="sm" disabled={stats.length === 0}>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Staff Name</TableHead>
                            <TableHead>Hospital</TableHead>
                            <TableHead className="text-right">No of Cases</TableHead>
                            <TableHead className="text-right">No. of Preauth Approved Cases</TableHead>
                            <TableHead className="text-right">Total Final Approval</TableHead>
                            <TableHead className="text-right">No. of Denial Cases</TableHead>
                            <TableHead className="text-right">No. of Settled Cases</TableHead>
                            <TableHead className="text-right">Attendance</TableHead>
                            <TableHead className="text-right">Total Collection</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats && stats.length > 0 ? (
                            stats.map((stat) => (
                                <TableRow key={stat.staffId}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={stat.staffPhoto ?? undefined} alt={stat.staffName} />
                                            <AvatarFallback>{getInitials(stat.staffName)}</AvatarFallback>
                                        </Avatar>
                                        {stat.staffName}
                                    </TableCell>
                                    <TableCell>{stat.hospitalName}</TableCell>
                                    <TableCell className="text-right">{stat.numOfCases}</TableCell>
                                    <TableCell className="text-right">{stat.preAuthApprovedCases}</TableCell>
                                    <TableCell className="text-right">{stat.totalFinalApproval}</TableCell>
                                    <TableCell className="text-right">{stat.rejectionCount}</TableCell>
                                    <TableCell className="text-right">{stat.settledCasesCount}</TableCell>
                                    <TableCell className="text-right">{stat.attendance}</TableCell>
                                    <TableCell className="text-right font-mono">{stat.totalCollection.toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No staff performance data available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
    );
}
