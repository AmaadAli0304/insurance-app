
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StaffPerformanceStat } from "./actions";

interface StaffPerformanceTableProps {
  stats: StaffPerformanceStat[];
}

export function StaffPerformanceTable({ stats }: StaffPerformanceTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
                <CardDescription>Performance metrics for each staff member.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Staff Name</TableHead>
                            <TableHead>Hospital</TableHead>
                            <TableHead className="text-right">No of Cases</TableHead>
                            <TableHead className="text-right">Total Collection</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats && stats.length > 0 ? (
                            stats.map((stat) => (
                                <TableRow key={stat.staffId}>
                                    <TableCell className="font-medium">{stat.staffName}</TableCell>
                                    <TableCell>{stat.hospitalName}</TableCell>
                                    <TableCell className="text-right">{stat.numOfCases}</TableCell>
                                    <TableCell className="text-right font-mono">Rs {stat.totalCollection.toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No staff performance data available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
