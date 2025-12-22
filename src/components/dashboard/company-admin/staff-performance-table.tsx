

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StaffPerformanceStat } from "./actions";
import { Loader2, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface StaffPerformanceTableProps {
  stats: StaffPerformanceStat[];
  isLoading: boolean;
}

export function StaffPerformanceTable({ stats, isLoading }: StaffPerformanceTableProps) {
    
    const getInitials = (name: string) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleExport = () => {
        const headers = ["Staff Name", "Hospital", "No of Cases", "Total Final Approval", "Total Collection"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.staffName}"`,
                `"${stat.hospitalName}"`,
                stat.numOfCases,
                stat.totalFinalApproval,
                stat.totalCollection,
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
                            <TableHead>Staff Name</TableHead>
                            <TableHead>Hospital</TableHead>
                            <TableHead className="text-right">No of Cases</TableHead>
                            <TableHead className="text-right">Total Final Approval</TableHead>
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
                                    <TableCell className="text-right">{stat.totalFinalApproval}</TableCell>
                                    <TableCell className="text-right font-mono">{stat.totalCollection.toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
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
