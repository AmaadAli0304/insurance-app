
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPatientBilledStatsForAdmin, getTpaList, PatientBilledStat } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TPA } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/components/auth-provider";

interface AdminPatientBillingTableProps {
  dateRange?: DateRange;
}

export function AdminPatientBillingTable({ dateRange }: AdminPatientBillingTableProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<PatientBilledStat[]>([]);
    const [tpaList, setTpaList] = useState<Pick<TPA, 'id' | 'name'>[]>([]);
    const [selectedTpaId, setSelectedTpaId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const hospitalId = user.role === 'Admin' ? user.hospitalId : null;
            const [patientData, tpas] = await Promise.all([
                getPatientBilledStatsForAdmin(dateRange, hospitalId, selectedTpaId),
                getTpaList(),
            ]);
            setStats(patientData);
            setTpaList(tpas);
        } catch (error) {
            console.error("Failed to load patient billing stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, user, selectedTpaId]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleExport = () => {
        const headers = ["Patient Name", "TPA / Insurance", "Billed Amount", "Sanctioned Amount"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.patientName}"`,
                `"${stat.tpaName}"`,
                stat.billedAmount,
                stat.sanctionedAmount,
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "patient_billing_summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Patient Billing Summary</CardTitle>
                    <CardDescription>A summary of billed and sanctioned amounts per patient.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => setSelectedTpaId(value === 'all' ? null : value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by TPA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All TPAs</SelectItem>
                            {tpaList.map(tpa => <SelectItem key={tpa.id} value={String(tpa.id)}>{tpa.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
                                <TableHead>Patient Name</TableHead>
                                <TableHead>TPA / Insurance</TableHead>
                                <TableHead className="text-right">Billed Amount</TableHead>
                                <TableHead className="text-right">Sanctioned Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats && stats.length > 0 ? (
                                stats.map((stat) => (
                                    <TableRow key={`${stat.patientId}-${stat.tpaName}`}>
                                        <TableCell className="font-medium flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                            <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                        </Avatar>
                                        {stat.patientName}
                                        </TableCell>
                                        <TableCell>{stat.tpaName}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.billedAmount.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.sanctionedAmount.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No patient billing data available for the selected period.
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
