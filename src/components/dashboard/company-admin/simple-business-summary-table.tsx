
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getSimpleHospitalBusinessStats, SimpleHospitalStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useState, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";


export function SimpleBusinessSummaryTable() {
    
    const [stats, setStats] = useState<SimpleHospitalStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<DateRange | undefined>({
      from: subDays(new Date(), 29),
      to: new Date(),
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSimpleHospitalBusinessStats(date);
            setStats(data);
        } catch (error) {
            console.error("Failed to load simplified hospital stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const totals = stats.reduce(
        (acc, curr) => {
            acc.numOfPatients += curr.numOfPatients;
            acc.amount += curr.amount;
            return acc;
        },
        {
            numOfPatients: 0,
            amount: 0,
        }
    );

    const handleExport = () => {
        const headers = ["Hospital Name", "No. of Patients", "Amount (Billed)"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.hospitalName}"`,
                stat.numOfPatients,
                stat.amount,
            ];
            csvRows.push(row.join(","));
        });
        
        csvRows.push([
            "TOTAL",
            totals.numOfPatients,
            totals.amount,
        ].join(","));

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "simple_hospital_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle>Simplified Hospital Summary</CardTitle>
                    <CardDescription>A summary of patients and billed amounts for each hospital.</CardDescription>
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
                                <TableHead className="w-[350px]">Hospital Name</TableHead>
                                <TableHead className="text-right">No. of Patients</TableHead>
                                <TableHead className="text-right">Amount (Billed)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.map((stat) => (
                                <TableRow key={stat.hospitalId}>
                                    <TableCell className="font-medium">{stat.hospitalName}</TableCell>
                                    <TableCell className="text-right">{stat.numOfPatients}</TableCell>
                                    <TableCell className="text-right">{stat.amount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableHead>TOTAL</TableHead>
                                <TableHead className="text-right">{totals.numOfPatients}</TableHead>
                                <TableHead className="text-right">{totals.amount.toLocaleString()}</TableHead>
                            </TableRow>
                        </TableFooter>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
