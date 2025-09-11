
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PatientBilledStat } from "./actions";

interface AdminPatientBillingTableProps {
  stats: PatientBilledStat[];
}

export function AdminPatientBillingTable({ stats }: AdminPatientBillingTableProps) {
    
    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Patients</CardTitle>
                <CardDescription>A summary of billed amounts per patient based on Pre-auth and Enhancement requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient Name</TableHead>
                            <TableHead>TPA / Insurance</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Amount Sanctioned</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats && stats.length > 0 ? (
                            stats.map((stat) => (
                                <TableRow key={stat.patientId}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                          <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                          <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                      </Avatar>
                                      {stat.patientName}
                                    </TableCell>
                                    <TableCell>{stat.tpaName}</TableCell>
                                    <TableCell className="text-right font-mono">${stat.billedAmount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono">${stat.sanctionedAmount.toLocaleString()}</TableCell>
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
            </CardContent>
        </Card>
    );
}
