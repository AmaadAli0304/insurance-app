
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Hospital, Claim, Patient } from "@/lib/types";

interface HospitalsTableProps {
    hospitals: Hospital[];
    claims: Claim[];
    patients: Patient[];
    insuranceCompanyId: string;
}

export function HospitalsTable({ hospitals, claims, patients }: HospitalsTableProps) {

    const getHospitalStats = (hospitalId: string) => {
        const hospitalPatients = patients.filter(p => p.hospitalId === hospitalId);
        const livePatients = hospitalPatients.length;

        const hospitalClaims = claims.filter(c => c.hospitalId === hospitalId);
        const pendingClaims = hospitalClaims.filter(c => c.status === 'Pending').length;
        const rejectedClaims = hospitalClaims.filter(c => c.status === 'Rejected').length; // Represents SLA Breaches

        return { livePatients, pendingClaims, rejectedClaims };
    }

    // Assuming a max value for visualization purposes
    const maxBreaches = Math.max(...hospitals.map(h => getHospitalStats(h.id).rejectedClaims), 1);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Hospitals</CardTitle>
                        <CardDescription>Performance overview of associated hospitals.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Comparison by</span>
                        <Select defaultValue="state">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="state">State</SelectItem>
                                <SelectItem value="patients">Live Patients</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hospital</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead>Live Patients</TableHead>
                            <TableHead>Pending Claims</TableHead>
                            <TableHead>SLA Breaches</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hospitals.map(hospital => {
                            const stats = getHospitalStats(hospital.id);
                            const addressParts = hospital.address.split(',');
                            const state = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : 'N/A';
                            const breachPercentage = (stats.rejectedClaims / maxBreaches) * 100;

                            return (
                                <TableRow key={hospital.id}>
                                    <TableCell className="font-medium">{hospital.name}</TableCell>
                                    <TableCell>{state}</TableCell>
                                    <TableCell>{stats.livePatients}</TableCell>
                                    <TableCell>{stats.pendingClaims}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span>{stats.rejectedClaims}</span>
                                            <Progress value={breachPercentage} className="w-[100px]" indicatorClassName={breachPercentage > 75 ? "bg-destructive" : "bg-primary"} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
