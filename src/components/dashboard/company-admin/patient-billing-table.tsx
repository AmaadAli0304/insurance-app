"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PatientBilledStat } from "./actions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TPA, Hospital } from "@/lib/types";


interface PatientBillingTableProps {
  stats: PatientBilledStat[];
  tpaList: Pick<TPA, 'id' | 'name'>[];
  hospitalList: Pick<Hospital, 'id' | 'name'>[];
  onTpaChange: (tpaId: string | null) => void;
  onHospitalChange: (hospitalId: string | null) => void;
}

export function PatientBillingTable({ stats, tpaList, hospitalList, onTpaChange, onHospitalChange }: PatientBillingTableProps) {
    
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
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Patient Billing Summary</CardTitle>
                    <CardDescription>A summary of billed amounts per patient based on Pre-auth and Enhancement requests.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => onHospitalChange(value === 'all' ? null : value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Hospital" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Hospitals</SelectItem>
                            {hospitalList.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => onTpaChange(value === 'all' ? null : value)}>
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
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                          <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                          <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                      </Avatar>
                                      {stat.patientName}
                                    </TableCell>
                                    <TableCell>{stat.hospitalName}</TableCell>
                                    <TableCell>{stat.tpaName}</TableCell>
                                    <TableCell className="text-right font-mono">${stat.billedAmount.toLocaleString()}</TableCell>
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
            </CardContent>
        </Card>
    );
}
