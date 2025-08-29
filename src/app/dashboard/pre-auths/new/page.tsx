
"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleAddRequest } from "../actions";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, Send } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { getPatientWithDetailsForForm, getPatientsForPreAuth } from "@/app/dashboard/patients/actions";
import type { Patient } from "@/lib/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <Send className="mr-2 h-4 w-4" />
            {pending ? "Submitting..." : "Send Request"}
        </Button>
    );
}

const DetailItem = ({ label, value, className }: { label: string, value?: string | number | null, className?: string }) => (
    <div className={className}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-base font-medium">{value || "N/A"}</p>
    </div>
);


function NewRequestForm() {
    const { user } = useAuth();
    const [state, formAction] = useActionState(handleAddRequest, { message: "" });
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(searchParams.get('patientId'));
    const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);
    const [hospitalPatients, setHospitalPatients] = useState<{ id: string; fullName: string; admission_id: string; }[]>([]);

    useEffect(() => {
        if (!user?.hospitalId) return;
        async function loadPatients() {
            try {
                const patients = await getPatientsForPreAuth(user!.hospitalId!);
                setHospitalPatients(patients);
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch hospital patients.", variant: 'destructive' });
            }
        }
        loadPatients();
    }, [user?.hospitalId, toast]);
    
    useEffect(() => {
        if (state.type === 'success') {
            toast({
                title: "Pre-Authorization",
                description: state.message,
                variant: "success",
            });
            router.push('/dashboard/pre-auths');
        } else if (state.type === 'error') {
            toast({
                title: "Error",
                description: state.message,
                variant: "destructive"
            });
        }
    }, [state, toast, router]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedPatientId) {
                setPatientDetails(null);
                return;
            }
            setIsLoadingPatient(true);
            try {
                const details = await getPatientWithDetailsForForm(selectedPatientId);
                setPatientDetails(details);
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch patient details.", variant: 'destructive' });
            } finally {
                setIsLoadingPatient(false);
            }
        };
        fetchDetails();
    }, [selectedPatientId, toast]);
    
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return format(new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000), 'MMMM dd, yyyy');
        } catch { return "Invalid Date"; }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/pre-auths">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Pre-Authorization</h1>
            </div>
            <form action={formAction}>
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                 <input type="hidden" name="from" value={user?.email || ''} />
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Patient</CardTitle>
                             <CardDescription>Select a patient to populate their details and compose the request.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Label htmlFor="patientId">Select Patient</Label>
                            <Select name="patientId" required onValueChange={setSelectedPatientId} value={selectedPatientId ?? ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a patient from your hospital" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hospitalPatients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.fullName} - {p.admission_id}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {isLoadingPatient && (
                        <div className="flex items-center justify-center rounded-lg border p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {patientDetails && (
                        <>
                        <Card>
                            <CardHeader><CardTitle>Patient Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <DetailItem label="Full Name" value={patientDetails.fullName} />
                                <DetailItem label="Date of Birth" value={formatDate(patientDetails.dateOfBirth)} />
                                <DetailItem label="Gender" value={patientDetails.gender} />
                                <DetailItem label="Phone Number" value={patientDetails.phoneNumber} />
                                <DetailItem label="Address" value={patientDetails.address} className="col-span-2 md:col-span-4" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Insurance Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <DetailItem label="Insurance Company" value={patientDetails.companyName} />
                                <DetailItem label="TPA" value={patientDetails.tpaName} />
                                <DetailItem label="Policy Number" value={patientDetails.policyNumber} />
                                <DetailItem label="Member/Card ID" value={patientDetails.memberId} />
                                <DetailItem label="Policy Start Date" value={formatDate(patientDetails.policyStartDate)} />
                                <DetailItem label="Policy End Date" value={formatDate(patientDetails.policyEndDate)} />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Admission & Treatment Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <DetailItem label="Admission ID" value={patientDetails.admission_id} />
                                <DetailItem label="Treating Doctor" value={patientDetails.treat_doc_name} />
                                <DetailItem label="Doctor's Reg. No." value={patientDetails.treat_doc_reg_no} />
                                <DetailItem label="Doctor's Qualification" value={patientDetails.treat_doc_qualification} />
                            </CardContent>
                        </Card>
                        </>
                    )}


                    <Card>
                        <CardHeader>
                            <CardTitle>Compose Request</CardTitle>
                             <CardDescription>Draft the email to the insurance provider.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="to">To <span className="text-destructive">*</span></Label>
                                    <Input id="to" name="to" placeholder="e.g. claims@company.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="from">From</Label>
                                    <Input id="from-display" name="from-display" value={user?.email} readOnly disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                                <Input id="subject" name="subject" placeholder="Pre-Authorization Request for..." required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="details">Compose Email <span className="text-destructive">*</span></Label>
                                <Textarea id="details" name="details" placeholder="Please approve treatment for..." required rows={10}/>
                            </div>
                        </CardContent>
                    </Card>

                     <div className="flex justify-end gap-4">
                        {state.type === 'error' && <p className="text-sm text-destructive self-center">{state.message}</p>}
                        <Button type="button" variant="outline">
                           <Download className="mr-2 h-4 w-4" />
                           Download as PDF
                        </Button>
                        <SubmitButton />
                     </div>
                </div>
            </form>
        </div>
    );
}


export default function NewRequestPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <NewRequestForm />
        </React.Suspense>
    )
}
    
