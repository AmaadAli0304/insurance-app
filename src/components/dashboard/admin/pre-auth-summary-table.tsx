
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPreAuthSummaryStats, PreAuthSummaryStat } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PreAuthSummaryTableProps {
  dateRange?: DateRange;
}

export function PreAuthSummaryTable({ dateRange }: PreAuthSummaryTableProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<PreAuthSummaryStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const hospitalId = user?.role === 'Admin' ? user.hospitalId : null;
            const data = await getPreAuthSummaryStats(dateRange, hospitalId);
            setStats(data);
        } catch (error) {
            console.error("Failed to load pre-auth summary stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, user]);

    useEffect(() => {
        if(user) {
            loadData();
        }
    }, [loadData, user]);
    
    const handleExport = () => {
        const headers = ["Patient Name", "Status", "DOA", "TPA", "Insurance"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.patientName}"`,
                `"${stat.status}"`,
                stat.admissionDate ? format(new Date(stat.admissionDate), 'yyyy-MM-dd') : 'N/A',
                `"${stat.tpaName}"`,
                `"${stat.insuranceName}"`,
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "pre_auth_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Pre-Authorization Summary</CardTitle>
                    <CardDescription>A summary of pre-authorization requests.</CardDescription>
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
                                <TableHead>Patient Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>DOA</TableHead>
                                <TableHead>TPA</TableHead>
                                <TableHead>Insurance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats && stats.length > 0 ? (
                                stats.map((stat, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{stat.patientName}</TableCell>
                                        <TableCell><Badge>{stat.status}</Badge></TableCell>
                                        <TableCell>{stat.admissionDate ? format(new Date(stat.admissionDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                        <TableCell>{stat.tpaName}</TableCell>
                                        <TableCell>{stat.insuranceName}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No pre-authorization data available for the selected period.
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
