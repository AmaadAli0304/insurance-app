
"use client";

import { useState, useEffect } from "react";
import { getPatientById, getClaimsForPatientTimeline } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import type { Patient, Claim } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClaimTimeline } from "@/components/claim-timeline";


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
    const [claims, setClaims] = useState<Claim[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const [patientData, claimsData] = await Promise.all([
                    getPatientById(id),
                    getClaimsForPatientTimeline(id)
                ]);

                if (!patientData) {
                    notFound();
                    return;
                }
                setPatient(patientData);
                setClaims(claimsData);
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

    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
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

    const photoUrl = patient.photo && typeof patient.photo === 'object' ? patient.photo.url : null;


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={photoUrl ?? undefined} alt={patient.fullName} />
                        <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-3xl">{patient.fullName}</CardTitle>
                    <CardDescription>Patient Details</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
                    <DetailItem label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
                    <DetailItem label="Gender" value={patient.gender} />
                    <DetailItem label="Email Address" value={patient.email_address} />
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
            <ClaimTimeline claims={claims} patientName={patient.fullName} />
        </div>
    );
}
