"use client";

import { useState, useEffect } from "react";
import { getPatientById } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import type { Patient } from "@/lib/types";

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || "N/A"}</p>
    </div>
);

export default function ViewPatientPage() {
    const params = useParams();
    const id = params.id as string;
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const patientData = await getPatientById(id);
                if (!patientData) {
                    notFound();
                    return;
                }
                setPatient(patientData);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        try {
            // Add a day to counteract timezone issues if the date is off by one
            const date = new Date(dateString);
            const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
            return format(adjustedDate, 'MMMM dd, yyyy');
        } catch {
            return "Invalid Date";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-destructive">Error: {error}</div>;
    }

    if (!patient) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{patient.fullName}</CardTitle>
                    <CardDescription>Patient Details</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                    <DetailItem label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
                    <DetailItem label="Gender" value={patient.gender} />
                    <DetailItem label="Email Address" value={patient.email} />
                    <DetailItem label="Contact Number" value={patient.phoneNumber} />
                    <DetailItem label="Address" value={patient.address} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                    <DetailItem label="Insurance Company" value={patient.companyName} />
                    <DetailItem label="Policy Number" value={patient.policyNumber} />
                    <DetailItem label="Member ID" value={patient.memberId} />
                    <DetailItem label="Policy Start Date" value={formatDate(patient.policyStartDate)} />
                    <DetailItem label="Policy End Date" value={formatDate(patient.policyEndDate)} />
                </CardContent>
            </Card>
        </div>
    );
}
