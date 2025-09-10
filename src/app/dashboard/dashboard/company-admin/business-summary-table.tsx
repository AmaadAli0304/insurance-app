
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { HospitalBusinessStats } from "./actions";

interface BusinessSummaryTableProps {
  stats: HospitalBusinessStats[];
}

export function BusinessSummaryTable({ stats }: BusinessSummaryTableProps) {
    
    const totals = stats.reduce(
        (acc, curr) => {
            acc.activePatients += curr.activePatients;
            acc.preAuthApproved += curr.preAuthApproved;
            acc.preAuthPending += curr.preAuthPending;
            acc.finalAuthSanctioned += curr.finalAuthSanctioned;
            acc.billedAmount += curr.billedAmount;
            acc.collection += curr.collection;
            return acc;
        },
        {
            activePatients: 0,
            preAuthApproved: 0,
            preAuthPending: 0,
            finalAuthSanctioned: 0,
            billedAmount: 0,
            collection: 0,
        }
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Hospital Business Summary</CardTitle>
                <CardDescription>A summary of business activity across all hospitals.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Hospital Name</TableHead>
                            <TableHead className="text-right">Active Patients</TableHead>
                            <TableHead className="text-right">Pre-Auths Approved</TableHead>
                            <TableHead className="text-right">Pre-Auths Pending</TableHead>
                            <TableHead className="text-right">Final Auths Sanctioned</TableHead>
                            <TableHead className="text-right">Billed Amount</TableHead>
                            <TableHead className="text-right">Collection</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.map((stat) => (
                            <TableRow key={stat.hospitalId}>
                                <TableCell className="font-medium">{stat.hospitalName}</TableCell>
                                <TableCell className="text-right">{stat.activePatients}</TableCell>
                                <TableCell className="text-right">{stat.preAuthApproved}</TableCell>
                                <TableCell className="text-right">{stat.preAuthPending}</TableCell>
                                <TableCell className="text-right">{stat.finalAuthSanctioned}</TableCell>
                                <TableCell className="text-right">${stat.billedAmount.toLocaleString()}</TableCell>
                                <TableCell className="text-right">${stat.collection.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableHead>TOTAL</TableHead>
                            <TableHead className="text-right">{totals.activePatients}</TableHead>
                            <TableHead className="text-right">{totals.preAuthApproved}</TableHead>
                            <TableHead className="text-right">{totals.preAuthPending}</TableHead>
                            <TableHead className="text-right">{totals.finalAuthSanctioned}</TableHead>
                            <TableHead className="text-right">${totals.billedAmount.toLocaleString()}</TableHead>
                            <TableHead className="text-right">${totals.collection.toLocaleString()}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
