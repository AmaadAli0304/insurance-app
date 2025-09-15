
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStaffOnDutyStats, StaffOnDutyStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export function StaffOnDutyTable() {
    const [stats, setStats] = useState<StaffOnDutyStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getStaffOnDutyStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load staff on duty stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleExport = () => {
        const headers = ["Staff Name", "Hospital", "Pre-Auths", "Final Approvals", "Discharges", "Rejections"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.staffName}"`,
                `"${stat.hospitalName}"`,
                stat.preAuthCount,
                stat.finalApprovalCount,
                stat.dischargeCount,
                stat.rejectionCount,
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "staff_on_duty_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Today's Staff on Duty</CardTitle>
                    <CardDescription>A summary of daily activities for staff marked as present.</CardDescription>
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
                                <TableHead className="w-[200px]">Staff Name</TableHead>
                                <TableHead>Hospital</TableHead>
                                <TableHead className="text-right">Pre-auth</TableHead>
                                <TableHead className="text-right">Final Approval</TableHead>
                                <TableHead className="text-right">Discharge</TableHead>
                                <TableHead className="text-right">Rejection</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.length > 0 ? (
                                stats.map((stat) => (
                                    <TableRow key={stat.staffId}>
                                        <TableCell className="font-medium">{stat.staffName}</TableCell>
                                        <TableCell>{stat.hospitalName || 'N/A'}</TableCell>
                                        <TableCell className="text-right">{stat.preAuthCount}</TableCell>
                                        <TableCell className="text-right">{stat.finalApprovalCount}</TableCell>
                                        <TableCell className="text-right">{stat.dischargeCount}</TableCell>
                                        <TableCell className="text-right">{stat.rejectionCount}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No staff marked as present for today.
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
