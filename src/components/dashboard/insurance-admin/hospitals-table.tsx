
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Hospital, StaffingRequest, Patient } from "@/lib/types";

interface HospitalsTableProps {
    hospitals: Hospital[];
    requests: StaffingRequest[];
    patients: Patient[];
    companyId: string;
}

export function HospitalsTable({ hospitals, requests, patients }: HospitalsTableProps) {

    const getHospitalStats = (hospitalId: string) => {
        const hospitalPatients = patients.filter(p => p.hospitalId === hospitalId);
        const livePatients = hospitalPatients.length;

        const hospitalRequests = requests.filter(r => r.hospitalId === hospitalId);
        const pendingRequests = hospitalRequests.filter(r => r.status === 'Pending').length;
        const rejectedRequests = hospitalRequests.filter(r => r.status === 'Rejected').length; // Represents SLA Breaches

        return { livePatients, pendingRequests, rejectedRequests };
    }

    // Assuming a max value for visualization purposes
    const maxBreaches = Math.max(...hospitals.map(h => getHospitalStats(h.id).rejectedRequests), 1);

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
                            <TableHead>Pending Requests</TableHead>
                            <TableHead>SLA Breaches</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hospitals.map(hospital => {
                            const stats = getHospitalStats(hospital.id);
                            const addressParts = hospital.address.split(',');
                            const state = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : 'N/A';
                            const breachPercentage = (stats.rejectedRequests / maxBreaches) * 100;

                            return (
                                <TableRow key={hospital.id}>
                                    <TableCell className="font-medium">{hospital.name}</TableCell>
                                    <TableCell>{state}</TableCell>
                                    <TableCell>{stats.livePatients}</TableCell>
                                    <TableCell>{stats.pendingRequests}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span>{stats.rejectedRequests}</span>
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
