
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PatientBilledStats } from "./actions";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PatientBillingTableProps {
  stats: PatientBilledStats[];
  dateRange?: DateRange;
}

export function PatientBillingTable({ stats, dateRange }: PatientBillingTableProps) {
    
    const getDateRangeDescription = () => {
        if (dateRange?.from) {
            if (dateRange.to) {
                return `From ${format(dateRange.from, "LLL dd, y")} to ${format(dateRange.to, "LLL dd, y")}`;
            }
            return `For ${format(dateRange.from, "LLL dd, y")}`;
        }
        return "A summary of billed amounts per patient.";
    };

    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Patient Billing Summary</CardTitle>
                <CardDescription>{getDateRangeDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Hospital</TableHead>
                            <TableHead className="text-right">Billed Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.length > 0 ? (
                            stats.map((stat) => (
                                <TableRow key={stat.patientId}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                          <AvatarImage src={stat.patientPhoto ?? undefined} alt={stat.patientName} />
                                          <AvatarFallback>{getInitials(stat.patientName)}</AvatarFallback>
                                      </Avatar>
                                      {stat.patientName}
                                    </TableCell>
                                    <TableCell>{stat.hospitalName}</TableCell>
                                    <TableCell className="text-right font-mono">${stat.billedAmount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No patient billing data for the selected period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
