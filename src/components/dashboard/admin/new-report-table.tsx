
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNewReportStats, getTpaList, NewReportStat } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TPA } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";

interface NewReportTableProps {
  dateRange?: DateRange;
}

export function NewReportTable({ dateRange }: NewReportTableProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<NewReportStat[]>([]);
    const [tpaList, setTpaList] = useState<Pick<TPA, 'id' | 'name'>[]>([]);
    const [selectedTpaId, setSelectedTpaId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;


    const loadData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const hospitalId = user.role === 'Admin' ? user.hospitalId : null;
            const [{ stats: reportData, total }, tpas] = await Promise.all([
                getNewReportStats(dateRange, hospitalId, selectedTpaId, currentPage, itemsPerPage),
                getTpaList(),
            ]);
            setStats(reportData);
            setTotalPages(Math.ceil(total / itemsPerPage));
            setTpaList(tpas);
        } catch (error) {
            console.error("Failed to load new report stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, user, selectedTpaId, currentPage, itemsPerPage]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const handleExport = () => {
        const headers = ["Patient Name", "DOA", "Policy Number", "Claim Number", "TPA / Insurance", "USG/2DECHO/EEG", "X-Ray", "MRI/CT Scan", "Lab Exp", "Pharmacy Ex", "Implant Charges", "Total Bill Amt", "TPA Approved Amt", "Discount Amt", "Co-Pay", "Deductions", "Tariff Excess", "Amount Before TDS", "TDS", "Amount After TDS", "Deduction by Insurance Co.", "Actual Settlement Date", "BRN / UTR No.", "POD DETAILS"];
        const csvRows = [headers.join(",")];

        stats.forEach((stat) => {
            const row = [
                `"${stat.patientName}"`,
                stat.admissionDate ? format(new Date(stat.admissionDate), 'yyyy-MM-dd') : 'N/A',
                `"${stat.policyNumber || 'N/A'}"`,
                `"${stat.claimNumber || 'N/A'}"`,
                `"${stat.tpaName}"`,
                stat.usgCharges || 0,
                stat.xrayCharges || 0,
                stat.mriCharges || 0,
                stat.labCharges || 0,
                stat.pharmacyCharges || 0,
                stat.implantCharges || 0,
                stat.totalBillAmount || 0,
                stat.tpaApprovedAmount || 0,
                stat.discountAmount || 0,
                stat.coPay || 0,
                stat.deductions || 0,
                stat.tariffExcess || 0,
                stat.amountBeforeTds || 0,
                stat.tds || 0,
                stat.amountAfterTds || 0,
                stat.insuranceDeduction || 0,
                stat.actualSettlementDate ? format(new Date(stat.actualSettlementDate), 'yyyy-MM-dd') : 'N/A',
                `"${stat.utrNumber || 'N/A'}"`,
                `"${stat.podDetails || 'N/A'}"`,
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "new_report.csv");
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
                    <CardTitle>New Report</CardTitle>
                    <CardDescription>This is a new report with data.</CardDescription>
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
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patient Name</TableHead>
                                        <TableHead>DOA</TableHead>
                                        <TableHead>Policy Number</TableHead>
                                        <TableHead>Claim Number</TableHead>
                                        <TableHead>TPA / Insurance</TableHead>
                                        <TableHead className="text-right">USG/2DECHO/EEG</TableHead>
                                        <TableHead className="text-right">X-Ray</TableHead>
                                        <TableHead className="text-right">MRI/CT Scan</TableHead>
                                        <TableHead className="text-right">Lab Exp</TableHead>
                                        <TableHead className="text-right">Pharmacy Ex</TableHead>
                                        <TableHead className="text-right">Implant Charges</TableHead>
                                        <TableHead className="text-right">Total Bill Amt</TableHead>
                                        <TableHead className="text-right">TPA Approved Amt</TableHead>
                                        <TableHead className="text-right">Discount Amt</TableHead>
                                        <TableHead className="text-right">Co-Pay</TableHead>
                                        <TableHead className="text-right">Deductions</TableHead>
                                        <TableHead className="text-right">Tariff Excess</TableHead>
                                        <TableHead className="text-right">Amount Before TDS</TableHead>
                                        <TableHead className="text-right">TDS</TableHead>
                                        <TableHead className="text-right">Amount After TDS</TableHead>
                                        <TableHead className="text-right">Deduction by Insurance Co.</TableHead>
                                        <TableHead>Actual Settlement Date</TableHead>
                                        <TableHead>BRN / UTR No.</TableHead>
                                        <TableHead>POD DETAILS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats && stats.length > 0 ? (
                                        stats.map((stat, index) => (
                                            <TableRow key={`${stat.patientId}-${stat.tpaName}-${index}`}>
                                                <TableCell className="font-medium flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                                    <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                                </Avatar>
                                                {stat.patientName}
                                                </TableCell>
                                                <TableCell>{stat.admissionDate ? format(new Date(stat.admissionDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                                <TableCell>{stat.policyNumber || 'N/A'}</TableCell>
                                                <TableCell>{stat.claimNumber || 'N/A'}</TableCell>
                                                <TableCell>{stat.tpaName}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.usgCharges?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.xrayCharges?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.mriCharges?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.labCharges?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.pharmacyCharges?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.implantCharges?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.totalBillAmount?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.tpaApprovedAmount?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.discountAmount?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.coPay?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.deductions?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.tariffExcess?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.amountBeforeTds?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.tds?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.amountAfterTds?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{stat.insuranceDeduction?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                                <TableCell>{stat.actualSettlementDate ? format(new Date(stat.actualSettlementDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                                <TableCell>{stat.utrNumber || 'N/A'}</TableCell>
                                                <TableCell>{stat.podDetails || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={24} className="h-24 text-center">
                                                No data available for this report.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                         <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
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
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

    