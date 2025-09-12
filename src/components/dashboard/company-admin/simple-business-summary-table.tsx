
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { SimpleHospitalStat } from "./actions";

interface SimpleBusinessSummaryTableProps {
  stats: SimpleHospitalStat[];
}

export function SimpleBusinessSummaryTable({ stats }: SimpleBusinessSummaryTableProps) {
    
    const totals = stats.reduce(
        (acc, curr) => {
            acc.numOfPatients += curr.numOfPatients;
            acc.amount += curr.amount;
            return acc;
        },
        {
            numOfPatients: 0,
            amount: 0,
        }
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Simplified Hospital Summary</CardTitle>
                <CardDescription>A summary of patients and billed amounts for each hospital.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[350px]">Hospital Name</TableHead>
                            <TableHead className="text-right">No. of Patients</TableHead>
                            <TableHead className="text-right">Amount (Billed)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.map((stat) => (
                            <TableRow key={stat.hospitalId}>
                                <TableCell className="font-medium">{stat.hospitalName}</TableCell>
                                <TableCell className="text-right">{stat.numOfPatients}</TableCell>
                                <TableCell className="text-right">Rs {stat.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableHead>TOTAL</TableHead>
                            <TableHead className="text-right">{totals.numOfPatients}</TableHead>
                            <TableHead className="text-right">Rs {totals.amount.toLocaleString()}</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    );
}
