
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <Send className="mr-2 h-4 w-4" />
            {pending ? "Submitting..." : "Send Request"}
        </Button>
    );
}

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

     useEffect(() => {
        if (!user?.hospitalId) return;
        let isMounted = true;

        async function loadInitialData() {
            try {
                const patients = await getPatientsForPreAuth(user!.hospitalId!);
                if (!isMounted) return;
                
                setHospitalPatients(patients);

                const patientIdFromUrl = searchParams.get('patientId');
                if (patientIdFromUrl) {
                    const preselectedPatient = patients.find(p => String(p.id) === patientIdFromUrl);
                    if (preselectedPatient) {
                        setSelectedPatientId(preselectedPatient.id);
                        setSearchQuery(`${preselectedPatient.fullName} - ${preselectedPatient.admission_id}`);
                    }
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch hospital patients.", variant: 'destructive' });
            }
        }
        
        loadInitialData();
        
        return () => { isMounted = false; };

    }, [user?.hospitalId, searchParams, toast]);


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

    const formatDateForInput = (dateString?: string | null) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'yyyy-MM-dd');
        } catch {
            return '';
        }
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
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" name="fullName" defaultValue={patientDetails.fullName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                    <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={formatDateForInput(patientDetails.dateOfBirth)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select name="gender" defaultValue={patientDetails.gender ?? undefined}>
                                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" name="phoneNumber" defaultValue={patientDetails.phoneNumber ?? ''} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" name="address" defaultValue={patientDetails.address ?? ''} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Insurance Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Insurance Company</Label>
                                    <Input id="companyName" name="companyName" defaultValue={patientDetails.companyName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tpaName">TPA</Label>
                                    <Input id="tpaName" name="tpaName" defaultValue={patientDetails.tpaName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policyNumber">Policy Number</Label>
                                    <Input id="policyNumber" name="policyNumber" defaultValue={patientDetails.policyNumber ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="memberId">Member/Card ID</Label>
                                    <Input id="memberId" name="memberId" defaultValue={patientDetails.memberId ?? ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policyStartDate">Policy Start Date</Label>
                                    <Input id="policyStartDate" name="policyStartDate" type="date" defaultValue={formatDateForInput(patientDetails.policyStartDate)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policyEndDate">Policy End Date</Label>
                                    <Input id="policyEndDate" name="policyEndDate" type="date" defaultValue={formatDateForInput(patientDetails.policyEndDate)} />
                                </div>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>Admission & Treatment Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admissionId">Admission ID</Label>
                                    <Input id="admissionId" name="admissionId" defaultValue={patientDetails.admission_id} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="doctorName">Treating Doctor</Label>
                                    <Input id="doctorName" name="doctorName" defaultValue={patientDetails.treat_doc_name} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="doctorRegNo">Doctor's Reg. No.</Label>
                                    <Input id="doctorRegNo" name="doctorRegNo" defaultValue={patientDetails.treat_doc_reg_no} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="doctorQualification">Doctor's Qualification</Label>
                                    <Input id="doctorQualification" name="doctorQualification" defaultValue={patientDetails.treat_doc_qualification} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="proposedTreatment">Proposed Treatment</Label>
                                    <Input id="proposedTreatment" name="proposedTreatment" defaultValue={patientDetails.proposedTreatment} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estimatedCost">Estimated Cost</Label>
                                    <Input id="estimatedCost" name="estimatedCost" type="number" defaultValue={patientDetails.estimatedCost} />
                                </div>
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

    