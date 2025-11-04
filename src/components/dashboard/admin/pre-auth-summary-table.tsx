

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPreAuthSummaryStats, PreAuthSummaryStat } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PreAuthStatus } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface PreAuthSummaryTableProps {
  dateRange?: DateRange;
}

const getStatusVariant = (status: PreAuthStatus) => {
    switch (status) {
        case 'Pre auth Sent':
        case 'Enhancement Request':
            return 'badge-light-blue';
        case 'Query Raised':
            return 'badge-orange';
        case 'Query Answered':
        case 'Enhancement Approval':
            return 'badge-yellow';
        case 'Initial Approval':
        case 'Final Discharge sent':
            return 'badge-light-green';
        case 'Final Approval':
            return 'badge-green';
        case 'Settled':
            return 'badge-purple';
        case 'Rejected':
            return 'destructive';
        default:
            return 'secondary';
    }
}

export function PreAuthSummaryTable({ dateRange }: PreAuthSummaryTableProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState<PreAuthSummaryStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const hospitalId = user?.role === 'Admin' || user?.role === 'Hospital Staff' ? user.hospitalId : null;
            const { stats: data, total } = await getPreAuthSummaryStats(dateRange, hospitalId, currentPage, itemsPerPage);
            setStats(data);
            setTotalPages(Math.ceil(total / itemsPerPage));
        } catch (error) {
            console.error("Failed to load pre-auth summary stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, user, currentPage, itemsPerPage]);

    useEffect(() => {
        if(user) {
            loadData();
        }
    }, [loadData, user]);
    
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const hospitalId = user?.role === 'Admin' || user?.role === 'Hospital Staff' ? user.hospitalId : null;
            // Fetch all data for export
            const { stats: allStats } = await getPreAuthSummaryStats(dateRange, hospitalId, 1, 999999);

            const headers = ["Patient Name", "Contact No", "DOA", "TPA", "Insurance", "Plan of Management", "Type of admission", "Sum Insured", "Year/Corporate", "Status", "Dr in Charge", "Room Category", "Budget", "Approval Amount"];
            const csvRows = [headers.join(",")];

            allStats.forEach((stat) => {
                const row = [
                    `"${stat.patientName}"`,
                    `"${stat.contactNumber || 'N/A'}"`,
                    stat.admissionDate ? format(new Date(stat.admissionDate), 'yyyy-MM-dd') : 'N/A',
                    `"${stat.tpaName}"`,
                    `"${stat.insuranceName}"`,
                    `"${(stat.planOfManagement || 'N/A').replace(/"/g, '""')}"`,
                    `"${stat.admissionType || 'N/A'}"`,
                    stat.sumInsured || 0,
                    `"${stat.corporatePolicyNumber || 'N/A'}"`,
                    `"${stat.status}"`,
                    `"${stat.doctorInCharge || 'N/A'}"`,
                    `"${stat.roomCategory || 'N/A'}"`,
                    stat.budget || 0,
                    stat.approvalAmount || 0,
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
        } catch (error) {
            console.error("Failed to export data:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Pre-Authorization Summary</CardTitle>
                    <CardDescription>A summary of pre-authorization requests.</CardDescription>
                </div>
                <Button onClick={handleExport} variant="outline" size="sm" disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isExporting ? 'Exporting...' : 'Export'}
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1200px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>Contact No</TableHead>
                                    <TableHead>DOA</TableHead>
                                    <TableHead>TPA</TableHead>
                                    <TableHead>Insurance</TableHead>
                                    <TableHead>Plan of Management</TableHead>
                                    <TableHead>Type of admission</TableHead>
                                    <TableHead>Sum Insured</TableHead>
                                    <TableHead>Year/Corporate</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dr in Charge</TableHead>
                                    <TableHead>Room Category</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead>Approval Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats && stats.length > 0 ? (
                                    stats.map((stat, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                                    <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                                </Avatar>
                                                {stat.patientName}
                                            </TableCell>
                                            <TableCell>{stat.contactNumber || 'N/A'}</TableCell>
                                            <TableCell>{stat.admissionDate ? format(new Date(stat.admissionDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                            <TableCell>{stat.tpaName}</TableCell>
                                            <TableCell>{stat.insuranceName}</TableCell>
                                            <TableCell>{stat.planOfManagement || 'N/A'}</TableCell>
                                            <TableCell>{stat.admissionType || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-mono">{stat.sumInsured?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                            <TableCell>{stat.corporatePolicyNumber || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(getStatusVariant(stat.status as PreAuthStatus), 'border-transparent')}>
                                                    {stat.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{stat.doctorInCharge || 'N/A'}</TableCell>
                                            <TableCell>{stat.roomCategory || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-mono">{stat.budget?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                            <TableCell className="text-right font-mono">{stat.approvalAmount?.toLocaleString('en-IN') ?? 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={14} className="h-24 text-center">
                                            No pre-authorization data available for the selected period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
