

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPatientBilledStats, PatientBilledStat, getTpaList, getHospitalList } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TPA, Hospital } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";

interface PatientBillingTableProps {
  dateRange?: DateRange;
}

export function PatientBillingTable({ dateRange }: PatientBillingTableProps) {
    const [stats, setStats] = useState<PatientBilledStat[]>([]);
    const [tpaList, setTpaList] = useState<Pick<TPA, 'id' | 'name'>[]>([]);
    const [hospitalList, setHospitalList] = useState<Pick<Hospital, 'id' | 'name'>[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
    const [selectedTpaId, setSelectedTpaId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const loadPatientStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const [{ stats: patientData, total }, tpas, hospitals] = await Promise.all([
                getPatientBilledStats(dateRange, selectedHospitalId, selectedTpaId, currentPage, itemsPerPage),
                getTpaList(),
                getHospitalList(),
            ]);
            setStats(patientData);
            setTotalPages(Math.ceil(total / itemsPerPage));
            setTpaList(tpas);
            setHospitalList(hospitals);
        } catch (error) {
            console.error("Failed to load patient billing stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, selectedHospitalId, selectedTpaId, currentPage, itemsPerPage]);

    useEffect(() => {
        loadPatientStats();
    }, [loadPatientStats]);
    
    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleExport = () => {
        const headers = ["Sr No", "Patient Name", "Hospital", "TPA / Insurance", "Amount"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat, index) => {
            const row = [
                index + 1,
                `"${stat.patientName}"`,
                `"${stat.hospitalName}"`,
                `"${stat.tpaName}"`,
                stat.billedAmount,
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

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Short Payments</CardTitle>
                    <CardDescription>A summary of short payments per patient.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => setSelectedHospitalId(value === 'all' ? null : value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Hospital" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Hospitals</SelectItem>
                            {hospitalList.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr No</TableHead>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>Hospital</TableHead>
                                    <TableHead>TPA / Insurance</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats && stats.length > 0 ? (
                                    stats.map((stat, index) => (
                                        <TableRow key={stat.patientId}>
                                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                            <TableCell className="font-medium flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                                <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                            </Avatar>
                                            {stat.patientName}
                                            </TableCell>
                                            <TableCell>{stat.hospitalName}</TableCell>
                                            <TableCell>{stat.tpaName}</TableCell>
                                            <TableCell className="text-right font-mono">{stat.billedAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No patient billing data available.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
