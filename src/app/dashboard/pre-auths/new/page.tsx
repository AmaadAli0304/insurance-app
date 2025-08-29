
"use client";

import { useState, useActionState, useEffect, useMemo, useRef } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleAddRequest } from "../actions";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, Send, Check } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { getPatientWithDetailsForForm, getPatientsForPreAuth } from "@/app/dashboard/patients/actions";
import type { Patient } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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


export default function NewRequestPage() {
    const { user } = useAuth();
    const [state, formAction] = useActionState(handleAddRequest, { message: "" });
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);
    const [hospitalPatients, setHospitalPatients] = useState<{ id: string; fullName: string; admission_id: string; }[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchListOpen, setIsSearchListOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
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

    // Effect 1: Fetch the list of patients for the search dropdown.
    useEffect(() => {
        if (!user?.hospitalId) return;
        async function loadPatients() {
            try {
                const patients = await getPatientsForPreAuth(user!.hospitalId!);
                setHospitalPatients(patients);

                // Now that patients are loaded, check for a patient ID in the URL.
                const patientIdFromUrl = searchParams.get('patientId');
                if (patientIdFromUrl) {
                    const preselectedPatient = patients.find(p => p.id === patientIdFromUrl);
                    if (preselectedPatient) {
                        setSelectedPatientId(preselectedPatient.id);
                        setSearchQuery(`${preselectedPatient.fullName} - ${preselectedPatient.admission_id}`);
                    }
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch hospital patients.", variant: 'destructive' });
            }
        }
        loadPatients();
    }, [user?.hospitalId, toast, searchParams]);


    // Effect 2: Fetch full patient details whenever a patient is selected.
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
    
    // Effect 3: Handle clicks outside the search list to close it.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchListOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredPatients = useMemo(() => {
        if (!searchQuery) return [];
        // Prevent showing the list if the query exactly matches a selected patient
        const exactMatch = hospitalPatients.some(p => `${p.fullName} - ${p.admission_id}` === searchQuery);
        if (exactMatch && selectedPatientId) return [];

        return hospitalPatients.filter(p => 
            `${p.fullName} - ${p.admission_id}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, hospitalPatients, selectedPatientId]);


    const handlePatientSelect = (patient: { id: string; fullName: string; admission_id: string; }) => {
        setSelectedPatientId(patient.id);
        setSearchQuery(`${patient.fullName} - ${patient.admission_id}`);
        setIsSearchListOpen(false);
    };


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
                 <input type="hidden" name="patientId" value={selectedPatientId || ''} />
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                 <input type="hidden" name="from" value={user?.email || ''} />
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Patient</CardTitle>
                             <CardDescription>Search for a patient by name or admission ID to populate their details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div ref={searchContainerRef} className="relative">
                                <Label htmlFor="patient-search">Search Patient</Label>
                                <Input 
                                    id="patient-search"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value) {
                                            setIsSearchListOpen(true);
                                        }
                                        if (selectedPatientId) {
                                            setSelectedPatientId(null);
                                            setPatientDetails(null);
                                        }
                                    }}
                                    onFocus={() => setIsSearchListOpen(true)}
                                    placeholder="Search by name or admission ID..."
                                />
                                {isSearchListOpen && filteredPatients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                                        <ul className="max-h-60 overflow-auto">
                                            {filteredPatients.map(p => (
                                                <li 
                                                    key={p.id}
                                                    className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between"
                                                    onClick={() => handlePatientSelect(p)}
                                                >
                                                   <span>{p.fullName} - {p.admission_id}</span>
                                                   {selectedPatientId === p.id && <Check className="h-4 w-4" />}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
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
