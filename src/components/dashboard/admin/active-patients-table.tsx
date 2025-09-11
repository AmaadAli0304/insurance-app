"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ActivePatientStat } from "./actions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ActivePatientsTableProps {
  stats: ActivePatientStat[];
}

export function ActivePatientsTable({ stats }: ActivePatientsTableProps) {
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Patients</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>ID No</TableHead>
                            <TableHead>TPA</TableHead>
                            <TableHead className="text-right">Amount Requested</TableHead>
                            <TableHead className="text-right">Amount Sanctioned</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.length > 0 ? (
                            stats.map((stat, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{stat.patientName}</TableCell>
                                    <TableCell>{stat.admissionId || 'N/A'}</TableCell>
                                    <TableCell>{stat.tpaName || 'N/A'}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        ₹{stat.amountRequested?.toLocaleString('en-IN') ?? '0.00'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        ₹{stat.amountSanctioned?.toLocaleString('en-IN') ?? '0.00'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{stat.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No active patients found for the selected period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
