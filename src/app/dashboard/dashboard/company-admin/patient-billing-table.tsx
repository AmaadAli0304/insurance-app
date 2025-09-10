
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const dummyPatients = [
  { patientId: 'PAT-001', patientName: 'John Doe', patientPhoto: null, hospitalName: 'General Hospital', billedAmount: 5200, tpaName: 'HealthServe TPA' },
  { patientId: 'PAT-002', patientName: 'Jane Smith', patientPhoto: null, hospitalName: 'City Clinic', billedAmount: 1250, tpaName: 'MediCare Assist' },
  { patientId: 'PAT-003', patientName: 'Peter Jones', patientPhoto: null, hospitalName: 'Sunrise Medical', billedAmount: 15000, tpaName: 'HealthServe TPA' },
  { patientId: 'PAT-004', patientName: 'Mary Johnson', patientPhoto: null, hospitalName: 'General Hospital', billedAmount: 3400, tpaName: 'MediCare Assist' },
];

export function PatientBillingTable() {
    
    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Patient Billing Summary</CardTitle>
                <CardDescription>A summary of billed amounts per patient.</CardDescription>
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
                        {dummyPatients.length > 0 ? (
                            dummyPatients.map((stat, index) => (
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
